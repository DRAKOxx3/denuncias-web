'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listAdminCases } from '@/lib/api';
import type { AdminCase } from '@/lib/api';

export default function AdminCasesPage() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [status, setStatus] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">Casos</h1>
        <Link className="button-primary" href="/admin/cases/new">
          Nuevo caso
        </Link>
      </div>
      {status && <p className="text-sm text-amber-700">{status}</p>}
      <div className="card overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="p-2">Expediente</th>
              <th className="p-2">Ciudadano</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Dependencia</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2 font-medium">{c.numero_expediente}</td>
                <td className="p-2">{c.denunciante_nombre}</td>
                <td className="p-2">{c.estado}</td>
                <td className="p-2">{c.dependencia}</td>
                <td className="p-2">
                  <Link className="text-accent" href={`/admin/cases/${c.id}`}>
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cases.length === 0 && !status && (
          <p className="text-sm text-slate-500 p-2">No hay casos registrados.</p>
        )}
      </div>
    </div>
  );
}
