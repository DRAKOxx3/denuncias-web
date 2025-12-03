'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/cases', label: 'Casos' },
  { href: '/admin/payments', label: 'Pagos' },
  { href: '/admin/users', label: 'Usuarios' }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface text-slate-900 flex">
      <aside className="w-64 bg-white shadow-sm border-r hidden md:flex md:flex-col">
        <div className="p-5 border-b">
          <p className="text-xs uppercase tracking-widest text-primary/70">Panel gubernamental</p>
          <h2 className="text-lg font-semibold text-primary">Portal de Denuncias</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-primary/5 ${
                  active ? 'bg-primary/10 text-primary' : 'text-slate-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t text-sm">
          <button
            onClick={handleLogout}
            className="w-full rounded-md bg-primary text-white py-2 font-semibold hover:bg-[#0b3257] transition"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary/70">Administración</p>
              <h1 className="text-lg font-semibold text-primary">Gestión de denuncias</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-slate-500">Usuario</span>
                <span className="font-semibold text-slate-800">Administrador</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition"
              >
                Salir
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
