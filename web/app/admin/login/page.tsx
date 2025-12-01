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
    <div className="max-w-md mx-auto card space-y-4">
      <h1 className="text-xl font-semibold text-primary">Ingreso administrador</h1>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            className="rounded border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            className="rounded border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="button-primary w-full">
          Ingresar
        </button>
      </form>
      {status && <p className="text-sm text-amber-700">{status}</p>}
    </div>
  );
}
