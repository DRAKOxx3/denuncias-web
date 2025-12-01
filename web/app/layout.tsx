import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Denuncias Ciudadanas',
  description: 'Consulta y gestión de denuncias ciudadanas'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-surface text-slate-900">{children}</body>
    </html>
  );
}
