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
    <div className="card space-y-4">
      <h1 className="text-xl font-semibold text-primary">Editar caso</h1>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          Número de expediente
          <input
            className="rounded border px-3 py-2"
            value={form.numero_expediente}
            onChange={(e) => handleChange('numero_expediente', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Código de seguimiento
          <input
            className="rounded border px-3 py-2"
            value={form.codigo_seguimiento}
            onChange={(e) => handleChange('codigo_seguimiento', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nombre del denunciante
          <input
            className="rounded border px-3 py-2"
            value={form.denunciante_nombre}
            onChange={(e) => handleChange('denunciante_nombre', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Documento del denunciante
          <input
            className="rounded border px-3 py-2"
            value={form.denunciante_documento}
            onChange={(e) => handleChange('denunciante_documento', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Dependencia
          <input
            className="rounded border px-3 py-2"
            value={form.dependencia}
            onChange={(e) => handleChange('dependencia', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Estado
          <input
            className="rounded border px-3 py-2"
            value={form.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
          />
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="button-primary">
            Guardar cambios
          </button>
          <button
            type="button"
            className="rounded border px-4 py-2"
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
