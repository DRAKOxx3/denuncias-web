import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/admin/cases', label: 'Casos' },
  { href: '/admin/cases/new', label: 'Nuevo caso' }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-100 flex">
      <aside className="w-64 bg-white border-r shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-primary">Panel Admin</h2>
          <p className="text-xs text-slate-500">Gestión de denuncias</p>
        </div>
        <nav className="p-4 space-y-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 hover:bg-slate-100 text-slate-700"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/admin/login" className="block rounded px-3 py-2 hover:bg-slate-100 text-slate-700">
            Cerrar sesión / Login
          </Link>
        </nav>
      </aside>
      <section className="flex-1 p-6 space-y-4">{children}</section>
    </div>
  );
}
