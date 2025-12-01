import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary text-white shadow-sm">
        <div className="container flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-100">Portal de Denuncias</p>
            <h1 className="text-xl font-semibold">Ciudadanía y Transparencia</h1>
          </div>
          <Link
            href="/admin/login"
            className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium hover:bg-white hover:text-primary transition"
          >
            Área administrativa
          </Link>
        </div>
      </header>
      <main className="container py-10">{children}</main>
      <footer className="border-t bg-white/70 backdrop-blur">
        <div className="container py-4 text-xs text-slate-600 flex flex-wrap gap-2 justify-between">
          <span>Portal oficial para seguimiento de denuncias ciudadanas</span>
          <span className="text-slate-400">Actualizado diariamente</span>
        </div>
      </footer>
    </div>
  );
}
