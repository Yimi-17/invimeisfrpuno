import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// Componente para el formulario de auditoría
const AuditorForm = ({ onSubmit, onCancel, imeis }) => {
  const seriesVendidas = imeis.filter((imei) => imei.estado === "V");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const [auditors, setAuditors] = useState([
    { nombres: "", apellidos: "", dni: "" },
  ]);
  const [observaciones, setObservaciones] = useState("");

  const handleAuditorChange = (index, field, value) => {
    const newAuditors = [...auditors];
    newAuditors[index][field] = value;
    setAuditors(newAuditors);
  };

  const addAuditor = () =>
    setAuditors([...auditors, { nombres: "", apellidos: "", dni: "" }]);

  const removeAuditor = (index) => {
    if (auditors.length > 1) {
      setAuditors(auditors.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ auditors, observaciones });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={modalStyle}>
      <div className="modal-dialog" style={modalDialogStyle}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Información de Auditoría</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {auditors.map((auditor, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <h6>Auditor {index + 1}</h6>
                  <InputField
                    label="Nombres"
                    value={auditor.nombres}
                    onChange={(e) =>
                      handleAuditorChange(index, "nombres", e.target.value)
                    }
                    required
                  />
                  <InputField
                    label="Apellidos"
                    value={auditor.apellidos}
                    onChange={(e) =>
                      handleAuditorChange(index, "apellidos", e.target.value)
                    }
                    required
                  />
                  <InputField
                    label="DNI"
                    value={auditor.dni}
                    onChange={(e) =>
                      handleAuditorChange(index, "dni", e.target.value)
                    }
                    required
                    pattern="[0-9]{8}"
                    maxLength="8"
                  />
                  {auditors.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeAuditor(index)}
                    >
                      Eliminar Auditor
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary mb-3"
                onClick={addAuditor}
              >
                Agregar Otro Auditor
              </button>

              <div className="mb-3 border rounded p-3 bg-light">
                <h6 className="mb-3">Series Vendidas</h6>
                {seriesVendidas.length > 0 ? (
                  <>
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      <table className="table table-sm table-bordered">
                        <thead className="table-secondary">
                          <tr>
                            <th>IMEI</th>
                            <th>Fecha de Actualización</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriesVendidas.map((serie) => (
                            <tr key={serie.id}>
                              <td>{serie.imei}</td>
                              <td>
                                {new Date(serie.updatedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2">
                      <strong>Total series vendidas:</strong>{" "}
                      {seriesVendidas.length}
                    </div>
                  </>
                ) : (
                  <p className="text-muted mb-0">
                    No hay series vendidas para mostrar.
                  </p>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows="3"
                  placeholder="Ingrese observaciones adicionales..."
                ></textarea>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Exportar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para campos de entrada
const InputField = ({ label, ...props }) => (
  <div className="mb-3">
    <label className="form-label">{label}</label>
    <input type="text" className="form-control" {...props} />
  </div>
);

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  zIndex: 1050,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalDialogStyle = {
  margin: "0",
  zIndex: 1051,
  width: "100%",
  maxWidth: "500px",
};

// Componente principal para la gestión de IMEIs
const IMEIManager = () => {
  // Estados principales
  const [imeis, setImeis] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newIMEI, setNewIMEI] = useState("");
  const [newEstado, setNewEstado] = useState("L");
  const [editingIMEI, setEditingIMEI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [stateFilter, setStateFilter] = useState("ALL");
  const [selectedIMEIs, setSelectedIMEIs] = useState([]);
  const [exportFormat, setExportFormat] = useState(null);

  // Configuración de API
  const API_URL = "https://backinvfrpuno.onrender.com/imeis";
  const API_URL_ALL = `${API_URL}/all`;

  // Funciones principales
  const fetchIMEIs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL_ALL);
      setImeis(data);
    } catch (error) {
      console.error("Error al obtener los IMEIs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIMEIs();
  }, [fetchIMEIs]);

  const handleSearch = useCallback((imeis) => {
    let filteredImeis = imeis;
    if (stateFilter !== "ALL") {
      filteredImeis = filteredImeis.filter(imei => imei.estado === stateFilter);
    }
    if (searchTerm.trim()) {
      filteredImeis = filteredImeis.filter(({ imei }) => imei.endsWith(searchTerm));
    }
    return filteredImeis;
  }, [stateFilter, searchTerm]);

  const handleAction = async (action, imeiData) => {
    try {
      switch (action) {
        case "add":
          if (!newIMEI) return alert("El campo IMEI es obligatorio");
          await axios.post(API_URL, { imei: newIMEI, estado: newEstado });
          setNewIMEI("");
          setNewEstado("L");
          break;
        case "update":
          await axios.put(`${API_URL}/${imeiData.id}`, imeiData);
          setEditingIMEI(null);
          break;
        case "delete":
          if (window.confirm("¿Estás seguro de mover este IMEI a eliminados?")) {
            await axios.delete(`${API_URL}/${imeiData.id}`);
            alert("IMEI movido a eliminados exitosamente");
          }
          break;
      }
      fetchIMEIs();
    } catch (error) {
      console.error("Error en la operación:", error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleExport = useCallback((format) => {
    const validateAllSelected = () => {
      if (selectedIMEIs.length !== imeis.length) {
        const unselectedSeries = imeis.filter(imei => !selectedIMEIs.includes(imei.id));
        alert(`Faltan series por seleccionar:\n${unselectedSeries.map(i => i.imei).join(", ")}`);
        return false;
      }
      return true;
    };

    if (!validateAllSelected()) return;

    if (format === "excel") {
      setShowAuditForm(true);
    } else {
      const dataToExport = imeis.map(({ id, ...rest }) => rest);
      const blob = new Blob([Papa.unparse(dataToExport)], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "imeis_completos.csv";
      link.click();
    }
  }, [imeis, selectedIMEIs]);

  // Función para manejar la selección de IMEIs
  const handleIMEISelection = (imei) => {
    setSelectedIMEIs(prev => 
      prev.includes(imei.id) 
        ? prev.filter(id => id !== imei.id)
        : [...prev, imei.id]
    );
  };

  // Función para manejar la auditoría
  const handleAuditSubmit = ({ auditors, observaciones }) => {
    try {
      const formattedData = imeis.map(({ id, imei, estado, createdAt, updatedAt }) => ({
        IMEI: imei,
        ESTADO: estado === "L" ? "Libre" : "Vendido",
        "FECHA DE INGRESO": new Date(createdAt).toLocaleString(),
        "FECHA DE ACTUALIZACIÓN": new Date(updatedAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "IMEIs");

      // ... resto del código de exportación ...

      setShowAuditForm(false);
      setExportFormat(null);
    } catch (error) {
      console.error("Error en la exportación:", error);
      alert("Error al exportar. Por favor, intente nuevamente.");
    }
  };

  // Calcular IMEIs filtrados
  const filteredIMEIs = useMemo(() => {
    let filtered = imeis;
    
    if (stateFilter !== "ALL") {
      filtered = filtered.filter(imei => imei.estado === stateFilter);
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(({ imei }) => imei.endsWith(searchTerm));
    }
    
    return filtered;
  }, [imeis, stateFilter, searchTerm]);

  useEffect(() => {
    // Agregar Bootstrap Icons CDN
    const iconLink = document.createElement('link');
    iconLink.rel = 'stylesheet';
    iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css';
    document.head.appendChild(iconLink);

    // Limpiar al desmontar
    return () => {
      document.head.removeChild(iconLink);
    };
  }, []);

  return (
    <div className="container-fluid py-4 bg-light">
      <div className="container mt-5">
        <h2 className="text-center mb-4">Gestión de IMEIs</h2>

        <div className="row mb-3">
          <div className="col-12 col-md-3 mb-2 mb-md-0">
            <div className="input-group mb-3">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar por últimos dígitos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxLength="4"
              />
            </div>
          </div>

          {/* Filtro de Estado */}
          <div className="col-12 col-md-3 mb-2 mb-md-0">
            <div className="btn-group w-100" role="group">
              <input
                type="radio"
                className="btn-check"
                name="stateFilter"
                id="all"
                checked={stateFilter === "ALL"}
                onChange={() => setStateFilter("ALL")}
              />
              <label className="btn btn-outline-primary" htmlFor="all">
                Todos
              </label>

              <input
                type="radio"
                className="btn-check"
                name="stateFilter"
                id="libre"
                checked={stateFilter === "L"}
                onChange={() => setStateFilter("L")}
              />
              <label className="btn btn-outline-primary" htmlFor="libre">
                Libres
              </label>

              <input
                type="radio"
                className="btn-check"
                name="stateFilter"
                id="vendido"
                checked={stateFilter === "V"}
                onChange={() => setStateFilter("V")}
              />
              <label className="btn btn-outline-primary" htmlFor="vendido">
                Vendidos
              </label>
            </div>
          </div>

          <div className="col-12 col-md-3 mb-2 mb-md-0">
            <input
              type="text"
              className="form-control"
              placeholder="Nuevo IMEI"
              value={newIMEI}
              onChange={(e) => setNewIMEI(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3 mb-2 mb-md-0">
            <select
              className="form-control"
              value={newEstado}
              onChange={(e) => setNewEstado(e.target.value)}
            >
              <option value="L">Libre</option>
              <option value="V">Vendido</option>
            </select>
          </div>
          <div className="col-12 col-md-3">
            <button
              className="btn btn-primary w-100"
              onClick={() => handleAction("add")}
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="thead-dark">
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIMEIs(filteredIMEIs.map((imei) => imei.id));
                      } else {
                        setSelectedIMEIs([]);
                      }
                    }}
                    checked={selectedIMEIs.length === filteredIMEIs.length}
                  />
                </th>
                <th>IMEI</th>
                <th>Estado</th>
                <th>Fecha de Creación</th>
                <th>Última Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredIMEIs.map((imei) => (
                <tr key={imei.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIMEIs.includes(imei.id)}
                      onChange={() => handleIMEISelection(imei)}
                    />
                  </td>
                  <td>
                    {editingIMEI?.id === imei.id ? (
                      <input
                        type="text"
                        className="form-control"
                        value={editingIMEI.imei}
                        onChange={(e) =>
                          setEditingIMEI({ ...editingIMEI, imei: e.target.value })
                        }
                      />
                    ) : (
                      imei.imei
                    )}
                  </td>
                  <td>
                    {editingIMEI?.id === imei.id ? (
                      <select
                        className="form-control"
                        value={editingIMEI.estado}
                        onChange={(e) =>
                          setEditingIMEI({
                            ...editingIMEI,
                            estado: e.target.value,
                          })
                        }
                      >
                        <option value="L">Libre</option>
                        <option value="V">Vendido</option>
                      </select>
                    ) : imei.estado === "L" ? (
                      "Libre"
                    ) : (
                      "Vendido"
                    )}
                  </td>
                  <td>{new Date(imei.createdAt).toLocaleString()}</td>
                  <td>{new Date(imei.updatedAt).toLocaleString()}</td>
                  <td>
                    {editingIMEI?.id === imei.id ? (
                      <button
                        className="btn btn-success me-2"
                        onClick={() => handleAction("update", editingIMEI)}
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        className="btn btn-warning me-2"
                        onClick={() => setEditingIMEI(imei)}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() => handleAction("delete", imei)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <p>
            <strong>
              Total de IMEIs{" "}
              {stateFilter === "L"
                ? "Libres"
                : stateFilter === "V"
                ? "Vendidos"
                : ""}
              :
            </strong>{" "}
            {filteredIMEIs.length}
          </p>
        </div>

        <div className="mt-4">
          <div className="d-flex gap-3">
            <button
              onClick={() => handleExport("excel")}
              className="btn btn-primary"
            >
              Exportar a Excel
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="btn btn-secondary"
            >
              Exportar a CSV
            </button>
          </div>
        </div>

        <div className="mt-3 mb-3">
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedIMEIs([])}
            disabled={selectedIMEIs.length === 0}
          >
            Limpiar selección ({selectedIMEIs.length})
          </button>
        </div>

        {showAuditForm && (
          <AuditorForm
            imeis={imeis}
            onSubmit={handleAuditSubmit}
            onCancel={() => {
              setShowAuditForm(false);
              setExportFormat(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default IMEIManager;
