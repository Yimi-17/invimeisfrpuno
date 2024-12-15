import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExportIMEIs from './ExportIMEIs';  // Asumiendo que ExportIMEIs es un componente ya creado

const ListIMEIs = () => {
  const [imeis, setImeis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIMEIs = async () => {
      try {
        const response = await axios.get('http://localhost:3000/imeis');
        setImeis(response.data);
      } catch (error) {
        setError('Error al obtener los IMEIs');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchIMEIs();
  }, []);

  if (loading) {
    return <p className="text-center text-warning">Cargando...</p>;
  }

  if (error) {
    return <p className="text-center text-danger">{error}</p>;
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Listado de IMEIs</h2>

      {/* Componente de exportación */}
      <ExportIMEIs imeis={imeis} />

      {/* Tabla de IMEIs */}
      <table className="table table-bordered table-striped">
        <thead className="thead-dark">
          <tr>
            <th>IMEI</th>
            <th>Estado</th>
            <th>Fecha de Creación</th>
            <th>Última Actualización</th>
          </tr>
        </thead>
        <tbody>
          {imeis.map((imei) => (
            <tr key={imei.id}>
              <td>{imei.imei}</td>
              <td>{imei.estado === 'L' ? 'Libre' : 'Vendido'}</td>
              <td>{new Date(imei.createdAt).toLocaleString()}</td>
              <td>{new Date(imei.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListIMEIs;
