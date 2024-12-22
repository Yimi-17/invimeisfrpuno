import React, { useState, useEffect, useCallback } from "react";
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
  const [imeis, setImeis] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newIMEI, setNewIMEI] = useState("");
  const [newEstado, setNewEstado] = useState("L");
  const [editingIMEI, setEditingIMEI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);
  const [stateFilter, setStateFilter] = useState("ALL"); // Nuevo estado para filtrado
  const [selectedIMEIs, setSelectedIMEIs] = useState([]);

  const API_URL = "https://backinvfrpuno.onrender.com/imeis";
  const API_URL_ALL = `${API_URL}/all`;

  const fetchIMEIs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL_ALL); // Usar la URL para obtener todos
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

  const handleSearch = (imeis) => {
    let filteredImeis = imeis;

    // Primero aplicar filtro de estado
    if (stateFilter !== "ALL") {
      filteredImeis = filteredImeis.filter(
        (imei) => imei.estado === stateFilter
      );
    }

    // Luego aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      filteredImeis = filteredImeis.filter(({ imei }) =>
        imei.endsWith(searchTerm)
      );
    }

    return filteredImeis;
  };

  // Función para validar que todas las series estén seleccionadas
  const validateAllSeriesSelected = () => {
    // Verificar si todos los IMEIs están seleccionados
    const totalImeis = imeis.length;
    const totalSelected = selectedIMEIs.length;
    
    if (totalImeis !== totalSelected) {
      const unselectedSeries = imeis.filter(imei => !selectedIMEIs.includes(imei.id));
      const missingSeries = unselectedSeries.map(imei => imei.imei).join(', ');
      
      alert(`Debe seleccionar todas las series antes de exportar.\n\nSeries faltantes:\n${missingSeries}`);
      return false;
    }
    
    return true;
  };

  // Modificar handleExport
  const handleExport = (format) => {
    if (!validateAllSeriesSelected()) {
      return;
    }
  
    if (format === "excel") {
      setShowAuditForm(true);
    } else {
      const dataToExport = imeis.map(({ id, ...rest }) => rest);
      const blob = exportToCSV(dataToExport);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "imeis_completos.csv";
      link.click();
    }
    setExportFormat(format);
  };

  // Modificar handleAuditSubmit
  const handleAuditSubmit = ({ auditors, observaciones }) => {
    if (!validateAllSeriesSelected()) {
      return;
    }
  
    const formattedData = imeis.map(({ id, imei, estado, createdAt, updatedAt }) => ({
      IMEI: imei,
      ESTADO: estado === "L" ? "Libre" : "Vendido",
      "FECHA DE INGRESO": new Date(createdAt).toLocaleString(),
      "FECHA DE ACTUALIZACIÓN": new Date(updatedAt).toLocaleString(),
    }));
  
    // Resto del código de handleAuditSubmit...
  };

  const exportToCSV = (data) =>
    new Blob([Papa.unparse(data)], { type: "text/csv;charset=utf-8;" });

  const handleAction = async (action, imeiData) => {
    try {
      if (action === "add") {
        if (!newIMEI) return alert("El campo IMEI es obligatorio");
        await axios.post(API_URL, { imei: newIMEI, estado: newEstado });
        setNewIMEI("");
        setNewEstado("L");
      } else if (action === "update") {
        await axios.put(`${API_URL}/${imeiData.id}`, imeiData);
        setEditingIMEI(null);
      } else if (action === "delete") {
        const isConfirmed = window.confirm(
          "¿Estás seguro que deseas mover este IMEI a la lista de eliminados?"
        );
        if (isConfirmed) {
          try {
            // Usar la URL base correcta para el delete
            const response = await axios.delete(`${API_URL}/${imeiData.id}`);
            alert(
              response.data.message || "IMEI movido a eliminados exitosamente"
            );
            await fetchIMEIs();
          } catch (error) {
            console.error("Error al mover el IMEI:", error);
            const errorMessage =
              error.response?.data?.error ||
              "Error al mover el IMEI a eliminados";
            alert(`Error: ${errorMessage}. Por favor, intente nuevamente.`);
          }
        }
      }
      if (action !== "delete") {
        await fetchIMEIs();
      }
    } catch (error) {
      console.error("Error en la operación:", error);
      const errorMessage = error.response?.data?.error || error.message;
      alert(`Error en la operación: ${errorMessage}`);
    }
  };

  const handleIMEISelection = (imei) => {
    setSelectedIMEIs((prev) =>
      prev.includes(imei.id)
        ? prev.filter((id) => id !== imei.id)
        : [...prev, imei.id]
    );
  };

  if (loading) return <p className="text-center">Cargando...</p>;

  const filteredIMEIs = handleSearch(imeis);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestión de IMEIs</h2>

      <div className="row mb-3">
        <div className="col-12 col-md-3 mb-2 mb-md-0">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por últimos dígitos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength="4"
          />
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
  );
};

export default IMEIManager;
