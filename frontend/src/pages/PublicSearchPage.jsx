import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCase } from '../api/client.js';

const PublicSearchPage = () => {
  const [numeroExpediente, setNumeroExpediente] = useState('');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [codigoSeguimiento, setCodigoSeguimiento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await searchCase({
        numero_expediente: numeroExpediente,
        documento_identidad: documentoIdentidad,
        codigo_seguimiento: codigoSeguimiento
      });
      navigate(`/cases/${result.case?.id || 'demo'}`, { state: result });
    } catch (err) {
      setError(err.message || 'No se pudo buscar el expediente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Consultar estado de denuncia</h2>
      <p>Use el código de seguimiento o combine número de expediente y documento.</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Número de expediente</label>
          <input value={numeroExpediente} onChange={(e) => setNumeroExpediente(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Documento de identidad</label>
          <input value={documentoIdentidad} onChange={(e) => setDocumentoIdentidad(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Código de seguimiento</label>
          <input value={codigoSeguimiento} onChange={(e) => setCodigoSeguimiento(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default PublicSearchPage;
