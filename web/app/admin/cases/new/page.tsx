'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminCase } from '@/lib/api';

export default function AdminNewCasePage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    numero_expediente: '',
    codigo_seguimiento: '',
    denunciante_nombre: '',
    denunciante_documento: '',
    dependencia: '',
    estado: 'En revisión'
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Guardando...');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setStatus('Necesitas iniciar sesión.');
      return;
    }

    try {
      await createAdminCase(token, form);
      setStatus('Caso creado');
      router.push('/admin/cases');
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo crear el caso');
    }
  };

  return (
    <div className="card space-y-4">
      <h1 className="text-xl font-semibold text-primary">Nuevo caso</h1>
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
        <div className="md:col-span-2">
          <button type="submit" className="button-primary">
            Guardar
          </button>
        </div>
      </form>
      {status && <p className="text-sm text-amber-700">{status}</p>}
    </div>
  );
}
