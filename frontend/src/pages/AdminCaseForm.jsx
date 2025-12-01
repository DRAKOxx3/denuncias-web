import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const AdminCaseForm = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const isNew = caseId === 'new';
  const [form, setForm] = useState({
    numero_expediente: '',
    denunciante_nombre: '',
    denunciante_documento: '',
    estado: 'En revisión',
    dependencia: '',
    creado_por_admin_id: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call backend create/update endpoints
    navigate('/admin/cases');
  };

  return (
    <div className="card">
      <h2>{isNew ? 'Crear caso' : `Editar caso #${caseId}`}</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Número de expediente</label>
          <input name="numero_expediente" value={form.numero_expediente} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Denunciante (nombre)</label>
          <input name="denunciante_nombre" value={form.denunciante_nombre} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Denunciante (documento)</label>
          <input name="denunciante_documento" value={form.denunciante_documento} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Estado</label>
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option>En revisión</option>
            <option>En investigación</option>
            <option>Cerrado</option>
          </select>
        </div>
        <div className="input-group">
          <label>Dependencia</label>
          <input name="dependencia" value={form.dependencia} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Administrador creador</label>
          <input name="creado_por_admin_id" value={form.creado_por_admin_id} onChange={handleChange} />
        </div>
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
};

export default AdminCaseForm;
