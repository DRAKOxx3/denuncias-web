'use client';

import { FormEvent, useState } from 'react';
import { searchCase } from '@/lib/api';
import type { CaseSearchResponse } from '@/lib/api';

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
    <div className="space-y-6">
      <div className="card space-y-2">
        <h1 className="text-2xl font-semibold text-primary">Consulta tu expediente</h1>
        <p className="text-sm text-slate-600">
          Ingresa tu número de expediente y documento, o tu código de seguimiento para ver el estado de tu denuncia.
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Número de expediente
            <input
              className="rounded border px-3 py-2"
              value={numeroExpediente}
              onChange={(e) => setNumeroExpediente(e.target.value)}
              placeholder="EXP-001"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Documento de identidad
            <input
              className="rounded border px-3 py-2"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="12345678"
            />
          </label>
          <div className="md:col-span-2 text-center text-xs text-slate-500">o</div>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            Código de seguimiento
            <input
              className="rounded border px-3 py-2"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="SEG-ABC123"
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="button-primary w-full md:w-auto">
              Buscar
            </button>
          </div>
        </form>
        {status && <p className="text-sm text-amber-700">{status}</p>}
      </div>

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="card space-y-2">
            <h2 className="font-semibold text-lg">Resumen del caso</h2>
            <p className="text-sm text-slate-600">Expediente: {data.case.numero_expediente}</p>
            <p className="text-sm text-slate-600">Seguimiento: {data.case.codigo_seguimiento}</p>
            <p className="text-sm text-slate-600">Estado: {data.case.estado}</p>
            <p className="text-sm text-slate-600">Dependencia: {data.case.dependencia}</p>
          </section>

          <section className="card space-y-2">
            <h3 className="font-semibold">Pagos</h3>
            {data.payments.length === 0 && <p className="text-sm text-slate-500">No hay pagos.</p>}
            <ul className="space-y-2 text-sm">
              {data.payments.map((p) => (
                <li key={p.id} className="border rounded p-2">
                  <p className="font-medium">{p.concepto}</p>
                  <p>Estado: {p.estado}</p>
                  <p>Vence: {new Date(p.fecha_vencimiento).toLocaleDateString()}</p>
                  {p.fecha_pago && <p>Pagado: {new Date(p.fecha_pago).toLocaleDateString()}</p>}
                </li>
              ))}
            </ul>
          </section>

          <section className="card space-y-2 md:col-span-2">
            <h3 className="font-semibold">Línea de tiempo</h3>
            {data.timeline.length === 0 && <p className="text-sm text-slate-500">Sin eventos.</p>}
            <ul className="space-y-2 text-sm">
              {data.timeline.map((t) => (
                <li key={t.id} className="border rounded p-2 flex items-start gap-2">
                  <span className="text-xs text-slate-500 w-28">
                    {new Date(t.fecha_evento).toLocaleDateString()}
                  </span>
                  <div>
                    <p className="font-semibold">{t.tipo_evento}</p>
                    <p className="text-slate-600">{t.descripcion}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card space-y-2 md:col-span-2">
            <h3 className="font-semibold">Documentos</h3>
            {data.documents.length === 0 && <p className="text-sm text-slate-500">No hay documentos públicos.</p>}
            <ul className="space-y-2 text-sm">
              {data.documents.map((d) => (
                <li key={d.id} className="border rounded p-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{d.titulo}</p>
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
