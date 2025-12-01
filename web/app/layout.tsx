import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Denuncias Ciudadanas',
  description: 'Consulta y gestión de denuncias ciudadanas'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="container flex items-center justify-between py-4">
            <Link href="/" className="font-semibold text-lg text-primary">
              Denuncias Ciudadanas
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/">Búsqueda pública</Link>
              <Link href="/admin/cases">Panel admin</Link>
            </nav>
          </div>
        </header>
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}
