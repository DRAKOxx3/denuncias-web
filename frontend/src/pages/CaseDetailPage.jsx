import { useLocation, useNavigate, useParams } from 'react-router-dom';

const CaseDetailPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { caseId } = useParams();

  if (!state?.case) {
    return (
      <div className="card">
        <p>No hay datos de caso cargados. Vuelva a la búsqueda pública.</p>
        <button onClick={() => navigate('/')}>Ir a buscar</button>
      </div>
    );
  }

  const { case: caseInfo, timeline = [], documents = [], payments = [] } = state;

  return (
    <div className="card">
      <h2>Detalle de caso #{caseInfo.numero_expediente}</h2>
      <p>Estado: {caseInfo.estado}</p>
      <p>Denunciante: {caseInfo.denunciante_nombre} ({caseInfo.denunciante_documento})</p>
      <p>Dependencia: {caseInfo.dependencia}</p>
      <p>Fecha de inicio: {caseInfo.fecha_inicio}</p>

      <h3>Timeline</h3>
      <ul>
        {timeline.map((event) => (
          <li key={event.id}>
            <strong>{event.fecha_evento}</strong> - {event.tipo_evento}: {event.descripcion}
          </li>
        ))}
      </ul>

      <h3>Documentos</h3>
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            {doc.titulo} ({doc.tipo}) - {doc.visible_al_ciudadano ? 'Visible' : 'Interno'}
          </li>
        ))}
      </ul>

      <h3>Pagos</h3>
      <ul>
        {payments.map((pay) => (
          <li key={pay.id}>
            {pay.concepto}: {pay.monto} ({pay.estado || 'pendiente'})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CaseDetailPage;
