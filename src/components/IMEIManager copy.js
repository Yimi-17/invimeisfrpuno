import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const AuditorForm = ({ onSubmit, onCancel, imeis }) => {
  const seriesVendidas = imeis.filter(imei => imei.estado === 'V');
  // Asegurarnos que el body no se pueda scrollear cuando el modal está abierto
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [auditors, setAuditors] = useState([{ 
    nombres: '', 
    apellidos: '', 
    dni: '' 
  }]);
  const [observaciones, setObservaciones] = useState('');

  const handleAuditorChange = (index, field, value) => {
    const newAuditors = [...auditors];
    newAuditors[index][field] = value;
    setAuditors(newAuditors);
  };

  const addAuditor = () => {
    setAuditors([...auditors, { nombres: '', apellidos: '', dni: '' }]);
  };

  const removeAuditor = (index) => {
    if (auditors.length > 1) {
      const newAuditors = auditors.filter((_, i) => i !== index);
      setAuditors(newAuditors);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ auditors, observaciones });
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1050,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="modal-dialog" style={{ margin: '0', zIndex: 1051, width: '100%', maxWidth: '500px' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Información de Auditoría</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {auditors.map((auditor, index) => (
                <div key={index} className="mb-4 p-3 border rounded">
                  <h6>Auditor {index + 1}</h6>
                  <div className="mb-3">
                    <label className="form-label">Nombres</label>
                    <input
                      type="text"
                      className="form-control"
                      value={auditor.nombres}
                      onChange={(e) => handleAuditorChange(index, 'nombres', e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Apellidos</label>
                    <input
                      type="text"
                      className="form-control"
                      value={auditor.apellidos}
                      onChange={(e) => handleAuditorChange(index, 'apellidos', e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">DNI</label>
                    <input
                      type="text"
                      className="form-control"
                      value={auditor.dni}
                      onChange={(e) => handleAuditorChange(index, 'dni', e.target.value)}
                      required
                      pattern="[0-9]{8}"
                      maxLength="8"
                    />
                  </div>
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
              {/* Sección de Series Vendidas */}
              <div className="mb-3 border rounded p-3 bg-light">
                <h6 className="mb-3">Series Vendidas</h6>
                {seriesVendidas.length > 0 ? (
                  <>
                    <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
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
                              <td>{new Date(serie.updatedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2">
                      <strong>Total series vendidas:</strong> {seriesVendidas.length}
                    </div>
                  </>
                ) : (
                  <p className="text-muted mb-0">No hay series vendidas para mostrar.</p>
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
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
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

const IMEIManager = () => {
  const [imeis, setImeis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newIMEI, setNewIMEI] = useState('');
  const [newEstado, setNewEstado] = useState('L');
  const [editingIMEI, setEditingIMEI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  const API_URL = 'https://backinvfrpuno.onrender.com/imeis';

  const fetchIMEIs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(API_URL);
      setImeis(data);
    } catch (error) {
      console.error('Error al obtener los IMEIs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIMEIs();
  }, [fetchIMEIs]);

  const handleSearch = (imeis) => imeis.filter(({ imei }) =>
    imei.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = (format) => {
    setExportFormat(format);
    if (format === 'excel') {
      setShowAuditForm(true);
    } else {
      // Para CSV, mantener el comportamiento original
      const dataWithoutId = imeis.map(({ id, ...rest }) => rest);
      const blob = exportToCSV(dataWithoutId);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'imeis.csv';
      link.click();
    }
  };

  const handleAuditSubmit = ({ auditors, observaciones }) => {
    // Preparar los datos con los nuevos encabezados
    const formattedData = imeis.map(({ id, imei, estado, createdAt, updatedAt }) => ({
      'IMEI': imei,
      'ESTADO': estado === 'L' ? 'Libre' : 'Vendido',
      'FECHA DE INGRESO': new Date(createdAt).toLocaleString(),
      'FECHA DE ACTUALIZACIÓN': new Date(updatedAt).toLocaleString()
    }));
    
    // Crear una nueva hoja de trabajo para los datos de IMEI
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Crear una nueva hoja de trabajo para la información de auditoría
    const auditData = [
      ['INFORMACIÓN DE AUDITORÍA'],
      [''],
      ['Fecha de exportación:', new Date().toLocaleString()],
      [''],
      ['AUDITORES:'],
    ];

    // Agregar información de cada auditor
    auditors.forEach((auditor, index) => {
      auditData.push([`Auditor ${index + 1}:`]);
      auditData.push(['Nombres:', auditor.nombres]);
      auditData.push(['Apellidos:', auditor.apellidos]);
      auditData.push(['DNI:', auditor.dni]);
      auditData.push(['']);
    });

    // Agregar información de series vendidas
    const seriesVendidas = imeis.filter(imei => imei.estado === 'V');
    if (seriesVendidas.length > 0) {
      auditData.push(['']);
      auditData.push(['SERIES VENDIDAS:']);
      auditData.push(['Total de series vendidas:', seriesVendidas.length]);
      auditData.push(['']);
      auditData.push(['IMEI', 'Fecha de Actualización']);
      seriesVendidas.forEach(serie => {
        auditData.push([
          serie.imei,
          new Date(serie.updatedAt).toLocaleString()
        ]);
      });
    }

    // Agregar observaciones si existen
    if (observaciones) {
      auditData.push(['']);
      auditData.push(['OBSERVACIONES:']);
      auditData.push([observaciones]);
    }

    const auditWorksheet = XLSX.utils.aoa_to_sheet(auditData);

    // Crear el libro de trabajo y agregar ambas hojas
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IMEIs');
    XLSX.utils.book_append_sheet(workbook, auditWorksheet, 'Información de Auditoría');

    // Exportar el archivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `imeis_auditoria_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();

    setShowAuditForm(false);
    setExportFormat(null);
  };

  const exportToCSV = (data) => new Blob([Papa.unparse(data)], { type: 'text/csv;charset=utf-8;' });

  const handleAction = async (action, imeiData) => {
    if (action === 'add') {
      if (!newIMEI) return alert('El campo IMEI es obligatorio');
      await axios.post(API_URL, { imei: newIMEI, estado: newEstado });
      setNewIMEI('');
      setNewEstado('L');
    } else if (action === 'update') {
      await axios.put(`${API_URL}/${imeiData.id}`, imeiData);
      setEditingIMEI(null);
    } else if (action === 'delete') {
      const isConfirmed = window.confirm('¿Estás seguro de que deseas eliminar este IMEI?');
      if (isConfirmed) {
        await axios.delete(`${API_URL}/${imeiData.id}`);
        alert('IMEI eliminado exitosamente');
      } else {
        console.log('Eliminación cancelada');
      }
    }
    fetchIMEIs();
  };

  if (loading) return <p className="text-center">Cargando...</p>;

  const filteredIMEIs = handleSearch(imeis);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestión de IMEIs</h2>

      {/* Resto del código del componente original... */}
      {/* Formulario para agregar IMEI */}
      <div className="row mb-3">
        <div className="col-12 col-md-3 mb-2 mb-md-0">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar IMEI"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
          <button className="btn btn-primary w-100" onClick={() => handleAction('add')}>
            Agregar
          </button>
        </div>
      </div>

      {/* Tabla de IMEIs */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="thead-dark">
            <tr>
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
                  {editingIMEI?.id === imei.id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editingIMEI.imei}
                      onChange={(e) => setEditingIMEI({ ...editingIMEI, imei: e.target.value })}
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
                      onChange={(e) => setEditingIMEI({ ...editingIMEI, estado: e.target.value })}
                    >
                      <option value="L">Libre</option>
                      <option value="V">Vendido</option>
                    </select>
                  ) : (
                    imei.estado === 'L' ? 'Libre' : 'Vendido'
                  )}
                </td>
                <td>{new Date(imei.createdAt).toLocaleString()}</td>
                <td>{new Date(imei.updatedAt).toLocaleString()}</td>
                <td>
                  {editingIMEI?.id === imei.id ? (
                    <button className="btn btn-success mr-2" onClick={() => handleAction('update', editingIMEI)}>
                      Guardar
                    </button>
                  ) : (
                    <button
                      className="btn btn-warning mr-2"
                      onClick={() => setEditingIMEI(imei)}
                    >
                      Editar
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => handleAction('delete', imei)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contador de IMEIs */}
      <div className="mt-3">
        <p><strong>Total de IMEIs:</strong> {filteredIMEIs.length}</p>
      </div>

      {/* Botones para exportar */}
      <div className="mt-4">
        <div className="d-flex gap-3">
          <button onClick={() => handleExport('excel')} className="btn btn-primary">
            Exportar a Excel
          </button>
          <button onClick={() => handleExport('csv')} className="btn btn-secondary">
            Exportar a CSV
          </button>
        </div>
      </div>

      {/* Modal de Auditoría */}
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