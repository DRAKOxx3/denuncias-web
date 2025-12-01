'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listAdminCases } from '@/lib/api';
import type { AdminCase } from '@/lib/api';

export default function AdminCasesPage() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const getBadgeClass = (estado: string) => {
    const key = estado.toLowerCase();
    if (key.includes('pend')) return 'bg-warning/15 text-amber-700 border-warning/30';
    if (key.includes('cerr') || key.includes('complet')) return 'bg-success/15 text-success border-success/30';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Inicia sesión para ver los casos.');
      return;
    }

    listAdminCases(token)
      .then((data) => {
        setCases(data);
        setStatus(null);
      })
      .catch((error: any) => setStatus(error?.message || 'No se pudo cargar la lista de casos'));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary/70">Expedientes</p>
          <h1 className="text-2xl font-semibold text-primary">Casos registrados</h1>
        </div>
        <Link className="button-primary" href="/admin/cases/new">
          Nuevo caso
        </Link>
      </div>
      {status && <p className="text-sm text-amber-700">{status}</p>}
      <div className="card overflow-hidden shadow-sm">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-primary/5 text-left text-slate-700">
              <tr>
                <th className="p-3 font-semibold">Expediente</th>
                <th className="p-3 font-semibold">Ciudadano</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 font-semibold">Dependencia</th>
                <th className="p-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => (
                <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                  <td className="p-3 font-semibold text-primary">{c.numero_expediente}</td>
                  <td className="p-3 text-slate-700">{c.denunciante_nombre}</td>
                  <td className="p-3">
                    <span className={`border px-3 py-1 rounded-full text-xs font-semibold ${getBadgeClass(c.estado)}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">{c.dependencia}</td>
                  <td className="p-3">
                    <Link className="font-semibold text-primary hover:underline" href={`/admin/cases/${c.id}`}>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cases.length === 0 && !status && (
          <p className="text-sm text-slate-500 p-4">No hay casos registrados.</p>
        )}
      </div>
    </div>
  );
}
