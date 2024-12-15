import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const IMEIManager = () => {
  const [imeis, setImeis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newIMEI, setNewIMEI] = useState('');
  const [newEstado, setNewEstado] = useState('L');
  const [editingIMEI, setEditingIMEI] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:3000/imeis';

  const fetchIMEIs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setImeis(response.data);
    } catch (error) {
      console.error('Error al obtener los IMEIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addIMEI = async () => {
    if (!newIMEI) return alert('El campo IMEI es obligatorio');
    try {
      await axios.post(API_URL, { imei: newIMEI, estado: newEstado });
      setNewIMEI('');
      setNewEstado('L');
      fetchIMEIs();
    } catch (error) {
      console.error('Error al agregar IMEI:', error);
    }
  };

  const updateIMEI = async () => {
    if (!editingIMEI) return;
    try {
      await axios.put(`${API_URL}/${editingIMEI.id}`, {
        imei: editingIMEI.imei,
        estado: editingIMEI.estado,
      });
      setEditingIMEI(null);
      fetchIMEIs();
    } catch (error) {
      console.error('Error al actualizar IMEI:', error);
    }
  };

  const deleteIMEI = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchIMEIs();
    } catch (error) {
      console.error('Error al eliminar IMEI:', error);
    }
  };

  const handleSearch = (imeis) => {
    return imeis.filter((imei) =>
      imei.imei.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const exportToExcel = () => {
    const dataWithoutId = imeis.map(({ id, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataWithoutId);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IMEIs');
    XLSX.writeFile(workbook, 'imeis.xlsx');
  };

  const exportToCSV = () => {
    const dataWithoutId = imeis.map(({ id, ...rest }) => rest);
    const csv = Papa.unparse(dataWithoutId);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'imeis.csv';
    link.click();
  };

  useEffect(() => {
    fetchIMEIs();
  }, []);

  if (loading) return <p className="text-center">Cargando...</p>;

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Gestión de IMEIs</h2>

      {/* Formulario para agregar IMEI */}
      <div className="d-flex mb-3">
        <input
          type="text"
          className="form-control mr-2"
          placeholder="Buscar IMEI"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="text"
          className="form-control mr-2"
          placeholder="Nuevo IMEI"
          value={newIMEI}
          onChange={(e) => setNewIMEI(e.target.value)}
        />
        <select
          className="form-control mr-2"
          value={newEstado}
          onChange={(e) => setNewEstado(e.target.value)}
        >
          <option value="L">Libre</option>
          <option value="V">Vendido</option>
        </select>
        <button className="btn btn-primary" onClick={addIMEI}>
          Agregar
        </button>
      </div>

      {/* Tabla de IMEIs */}
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
          {handleSearch(imeis).map((imei) => (
            <tr key={imei.id}>
              <td>
                {editingIMEI && editingIMEI.id === imei.id ? (
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
                {editingIMEI && editingIMEI.id === imei.id ? (
                  <select
                    className="form-control"
                    value={editingIMEI.estado}
                    onChange={(e) =>
                      setEditingIMEI({ ...editingIMEI, estado: e.target.value })
                    }
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
                {editingIMEI && editingIMEI.id === imei.id ? (
                  <button className="btn btn-success mr-2" onClick={updateIMEI}>
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
                <button className="btn btn-danger" onClick={() => deleteIMEI(imei.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botones para exportar */}
      <div className="mt-4">
        <div className="d-flex gap-3">
          <button onClick={exportToExcel} className="btn btn-primary">
            Exportar a Excel
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary">
            Exportar a CSV
          </button>
        </div>
    </div>
    </div>
  );
};

export default IMEIManager;
