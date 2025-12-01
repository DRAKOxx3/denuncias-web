'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listAdminCases, updateAdminCase } from '@/lib/api';
import type { AdminCase } from '@/lib/api';

export default function AdminEditCasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState<AdminCase | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }

    listAdminCases(token)
      .then((data) => {
        const current = data.find((c) => c.id === Number(params.id));
        if (!current) {
          setStatus('Caso no encontrado.');
          return;
        }
        setForm(current);
        setStatus(null);
      })
      .catch((error: any) => setStatus(error?.message || 'No se pudo cargar el caso'));
  }, [params.id]);

  const handleChange = (key: keyof AdminCase, value: string) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }
    setStatus('Guardando cambios...');

    try {
      await updateAdminCase(token, form.id, form);
      setStatus('Cambios guardados');
      router.push('/admin/cases');
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo actualizar el caso');
    }
  };

  if (!form) {
    return <p className="text-sm text-slate-600">{status || 'Cargando...'}</p>;
  }

  return (
    <div className="card space-y-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary/70">Edición</p>
          <h1 className="text-2xl font-semibold text-primary">Actualizar caso</h1>
        </div>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Número de expediente
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={form.numero_expediente}
            onChange={(e) => handleChange('numero_expediente', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Código de seguimiento
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={form.codigo_seguimiento}
            onChange={(e) => handleChange('codigo_seguimiento', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Nombre del denunciante
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={form.denunciante_nombre}
            onChange={(e) => handleChange('denunciante_nombre', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Documento del denunciante
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={form.denunciante_documento}
            onChange={(e) => handleChange('denunciante_documento', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Dependencia
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={form.dependencia}
            onChange={(e) => handleChange('dependencia', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Estado
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={form.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
          />
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button type="submit" className="button-primary">
            Guardar cambios
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => router.push('/admin/cases')}
          >
            Cancelar
          </button>
        </div>
      </form>
      {status && <p className="text-sm text-amber-700">{status}</p>}
    </div>
  );
}
