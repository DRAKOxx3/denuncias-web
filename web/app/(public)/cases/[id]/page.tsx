import { searchCase } from '@/lib/api';
import type { CaseSearchResponse } from '@/lib/api';
import { CitizenPaymentsSection } from './payments-section';

const badgeColors: Record<string, string> = {
  completado: 'bg-success/15 text-success border-success/30',
  pagado: 'bg-success/15 text-success border-success/30',
  pendiente: 'bg-warning/15 text-amber-700 border-warning/30',
  en: 'bg-primary/10 text-primary border-primary/20'
};

const getBadgeClass = (status: string) => {
  const key = status.toLowerCase();
  const match = Object.entries(badgeColors).find(([k]) => key.includes(k));
  return match ? match[1] : 'bg-slate-100 text-slate-700 border-slate-200';
};

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
      <div className="max-w-3xl mx-auto card space-y-3 text-center">
        <h1 className="text-xl font-semibold text-primary">No encontramos tu expediente</h1>
        <p className="text-sm text-slate-600">Verifica el código de seguimiento o regresa a la búsqueda pública.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-primary/70">Expediente</p>
            <h1 className="text-2xl font-semibold text-primary">{data.case.numero_expediente}</h1>
            <p className="text-sm text-slate-600">Código de seguimiento: {data.case.codigo_seguimiento}</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className={`border px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(data.case.estado)}`}>
              {data.case.estado}
            </span>
            <p className="text-sm text-slate-600">Dependencia: {data.case.dependencia}</p>
            <p className="text-xs text-slate-500">Actualizado {new Date(data.case.actualizado_en).toLocaleDateString()}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-primary">Línea de tiempo</h2>
            <span className="text-xs text-slate-500">Visibilidad ciudadana</span>
          </div>
          {data.timeline.length === 0 && <p className="text-sm text-slate-500">Sin eventos registrados.</p>}
          <ul className="space-y-3 text-sm">
            {data.timeline.map((event) => (
              <li key={event.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50/60 flex items-start gap-3">
                <span className="text-xs text-slate-500 w-28">{new Date(event.fecha_evento).toLocaleDateString()}</span>
                <div className="space-y-1">
                  <p className="font-semibold text-primary">{event.tipo_evento}</p>
                  <p className="text-slate-700 leading-relaxed">{event.descripcion}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-primary">Documentos públicos</h2>
            <span className="text-xs text-slate-500">Archivos compartidos</span>
          </div>
          {data.documents.length === 0 && <p className="text-sm text-slate-500">No hay documentos disponibles.</p>}
          <ul className="space-y-3 text-sm">
            {data.documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-lg border border-slate-200 p-3 bg-slate-50/60 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-primary">{doc.titulo}</p>
                  <p className="text-slate-600 text-xs">{doc.tipo}</p>
                </div>
                <span className="text-xs text-slate-500">{new Date(doc.creado_en).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <CitizenPaymentsSection
        caseId={data.case.id}
        paymentRequests={data.paymentRequests}
        payments={data.payments}
      />

    </div>
  );
}
