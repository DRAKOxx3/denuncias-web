import { searchCase } from '@/lib/api';
import type { CaseSearchResponse } from '@/lib/api';

async function fetchCase(trackingCode: string): Promise<CaseSearchResponse | null> {
  try {
    return await searchCase({ trackingCode });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const data = await fetchCase(params.id);

  if (!data) {
    return (
      <div className="card space-y-2">
        <h1 className="text-xl font-semibold">No encontramos tu expediente</h1>
        <p className="text-sm text-slate-600">
          Verifica el código de seguimiento o regresa a la búsqueda pública.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expediente {data.case.numero_expediente}</h1>
          <p className="text-sm text-slate-600">Seguimiento: {data.case.codigo_seguimiento}</p>
          <p className="text-sm text-slate-600">Estado: {data.case.estado}</p>
        </div>
        <div className="text-right text-sm text-slate-600">
          <p>Dependencia: {data.case.dependencia}</p>
          <p>Actualizado: {new Date(data.case.actualizado_en).toLocaleDateString()}</p>
        </div>
      </div>

      <section className="card space-y-2">
        <h2 className="font-semibold text-lg">Línea de tiempo</h2>
        {data.timeline.length === 0 && <p className="text-sm text-slate-500">Sin eventos registrados.</p>}
        <ul className="space-y-2 text-sm">
          {data.timeline.map((event) => (
            <li key={event.id} className="border rounded p-2 flex items-start gap-2">
              <span className="text-xs text-slate-500 w-28">
                {new Date(event.fecha_evento).toLocaleDateString()}
              </span>
              <div>
                <p className="font-semibold">{event.tipo_evento}</p>
                <p className="text-slate-600">{event.descripcion}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold text-lg">Documentos públicos</h2>
        {data.documents.length === 0 && <p className="text-sm text-slate-500">No hay documentos disponibles.</p>}
        <ul className="space-y-2 text-sm">
          {data.documents.map((doc) => (
            <li key={doc.id} className="border rounded p-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">{doc.titulo}</p>
                <p className="text-slate-600 text-xs">{doc.tipo}</p>
              </div>
              <span className="text-xs text-slate-500">{new Date(doc.creado_en).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold text-lg">Pagos</h2>
        {data.payments.length === 0 && <p className="text-sm text-slate-500">No hay pagos asociados.</p>}
        <ul className="space-y-2 text-sm">
          {data.payments.map((payment) => (
            <li key={payment.id} className="border rounded p-2">
              <p className="font-semibold">{payment.concepto}</p>
              <p>Estado: {payment.estado}</p>
              <p>Vence: {new Date(payment.fecha_vencimiento).toLocaleDateString()}</p>
              {payment.fecha_pago && <p>Pagado: {new Date(payment.fecha_pago).toLocaleDateString()}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
