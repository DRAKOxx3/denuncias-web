# Proyecto denuncias-web

Estructura base para un sistema de gestión de denuncias con backend en Node.js/Express y frontend en React (Vite). Incluye endpoints públicos para consulta de expedientes y panel de administración con autenticación JWT.

## Backend (`backend/`)
- Express + Prisma ORM con base de datos SQLite local (`backend/prisma/dev.db`).
- Rutas públicas: `/api/cases/search` para consulta por expediente o código de seguimiento.
- Rutas admin: CRUD de casos, timeline, documentos, pagos y usuarios con middlewares `authenticate` y `authorize` (roles `admin` y `super_admin`).
- Variables de entorno de ejemplo en `.env.example` (incluye `DATABASE_URL` apuntando al archivo SQLite y `JWT_SECRET`).
- Script de seed con datos de ejemplo y usuario admin `admin@example.com` / `admin123` (rol `super_admin`).

### Puesta en marcha del backend
1. Instalar dependencias
   ```bash
   cd backend
   npm install
   ```

2. Ejecutar migraciones y generar el cliente Prisma
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

3. Opcional: cargar datos de ejemplo
   ```bash
   npm run prisma:seed
   ```

4. Arrancar el servidor
   ```bash
   npm run dev
   ```

## Frontend (`frontend/`)
- Vite + React + React Router.
- Pantalla pública de búsqueda de expediente y página de detalle de caso.
- Panel admin con listado de casos y formulario básico de edición/creación.

## Próximos pasos sugeridos
- Conectar controladores a la base de datos PostgreSQL usando consultas parametrizadas.
- Añadir gestión real de archivos para documentos y comprobantes.
- Implementar flujos completos de autenticación y guardado de JWT en el cliente.
- Completar validaciones y manejo de errores.
