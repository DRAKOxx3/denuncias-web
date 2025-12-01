'use client';

import { FormEvent, useState } from 'react';
import { searchCase } from '@/lib/api';
import type { CaseSearchResponse } from '@/lib/api';
import { CitizenPaymentsSection } from './cases/[id]/payments-section';

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

export default function HomePage() {
  const [numeroExpediente, setNumeroExpediente] = useState('');
  const [documento, setDocumento] = useState('');
  const [tracking, setTracking] = useState('');
  const [data, setData] = useState<CaseSearchResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Buscando...');
    setData(null);

    try {
      const response = await searchCase({
        caseNumber: numeroExpediente || undefined,
        citizenIdNumber: documento || undefined,
        trackingCode: tracking || undefined
      });
      setData(response);
      setStatus(null);
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo buscar el expediente');
    }
  };

  return (
    <div className="space-y-8">
      <div className="max-w-3xl mx-auto">
        <div className="card shadow-md">
          <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
            <p className="text-xs uppercase tracking-widest text-primary/70">Consulta ciudadana</p>
            <h1 className="text-2xl font-semibold text-primary">Busca tu expediente</h1>
            <p className="text-sm text-slate-600">
              Ingresa tu número de expediente y documento, o tu código de seguimiento único para conocer el avance de
              tu denuncia.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 pt-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Número de expediente
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value)}
                placeholder="EXP-001"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Documento de identidad
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="12345678"
              />
            </label>
            <div className="md:col-span-2 text-center text-xs text-slate-500">o</div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Código de seguimiento
              <input
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="SEG-ABC123"
              />
            </label>
            <div className="md:col-span-2 flex flex-col gap-2">
              <button type="submit" className="button-primary w-full md:w-auto">
                Buscar expediente
              </button>
              {status && <p className="text-sm text-amber-700">{status}</p>}
            </div>
          </form>
        </div>
      </div>

      {data && (
        <div className="grid gap-6">
          <section className="card shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-primary/70">Expediente</p>
                <h2 className="text-2xl font-semibold text-primary">{data.case.numero_expediente}</h2>
                <p className="text-sm text-slate-600">Código de seguimiento: {data.case.codigo_seguimiento}</p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className={`border px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(data.case.estado)}`}>
                  {data.case.estado}
                </span>
                <p className="text-sm text-slate-600">Dependencia: {data.case.dependencia}</p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg text-primary">Línea de tiempo</h3>
                <span className="text-xs text-slate-500">Actualizado {new Date(data.case.actualizado_en).toLocaleDateString()}</span>
              </div>
              {data.timeline.length === 0 && <p className="text-sm text-slate-500">Sin eventos.</p>}
              <ul className="space-y-3 text-sm">
                {data.timeline.map((t) => (
                  <li key={t.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50/60 flex items-start gap-3">
                    <span className="text-xs text-slate-500 w-28">
                      {new Date(t.fecha_evento).toLocaleDateString()}
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-primary">{t.tipo_evento}</p>
                      <p className="text-slate-700 leading-relaxed">{t.descripcion}</p>
                    </div>
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

          <section className="card shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg text-primary">Documentos</h3>
              <span className="text-xs text-slate-500">Públicos</span>
            </div>
            {data.documents.length === 0 && <p className="text-sm text-slate-500">No hay documentos públicos.</p>}
            <ul className="space-y-3 text-sm">
              {data.documents.map((d) => (
                <li key={d.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50/60 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{d.titulo}</p>
                    <p className="text-slate-600 text-xs">{d.tipo}</p>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(d.creado_en).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
