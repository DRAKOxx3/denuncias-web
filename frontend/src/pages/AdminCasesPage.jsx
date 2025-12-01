import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminCases } from '../api/client.js';

const AdminCasesPage = () => {
  const [cases, setCases] = useState([]);
  const [token, setToken] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchAdminCases(token);
      setCases(data);
    };
    load();
  }, [token]);

  return (
    <div className="card">
      <h2>Casos</h2>
      <div className="input-group">
        <label>Token de administrador (JWT)</label>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Pega tu token JWT" />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Número</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.numero_expediente}</td>
              <td>{c.estado}</td>
              <td>
                <Link to={`/admin/cases/${c.id}`}>Editar</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/admin/cases/new">
        <button>Crear nuevo caso</button>
      </Link>
    </div>
  );
};

export default AdminCasesPage;
