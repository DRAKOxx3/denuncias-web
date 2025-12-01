'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Validando...');

    try {
      const { token } = await loginAdmin(email, password);
      localStorage.setItem('adminToken', token);
      setStatus('Acceso concedido, redirigiendo...');
      router.push('/admin/cases');
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo iniciar sesión');
    }
  };

  return (
    <div className="max-w-md mx-auto card space-y-6 shadow-md">
      <div className="space-y-1 text-center">
        <p className="text-xs uppercase tracking-widest text-primary/70">Acceso</p>
        <h1 className="text-2xl font-semibold text-primary">Ingreso administrativo</h1>
        <p className="text-sm text-slate-600">Usa tus credenciales institucionales para continuar.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Correo institucional
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Contraseña
          <input
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="button-primary w-full">
          Ingresar
        </button>
      </form>
      {status && <p className="text-sm text-amber-700 text-center">{status}</p>}
    </div>
  );
}
