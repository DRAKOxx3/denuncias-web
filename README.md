# Proyecto denuncias-web

Estructura base para un sistema de gestión de denuncias con backend en Node.js/Express y frontend en React (Vite). Incluye endpoints públicos para consulta de expedientes y panel de administración con autenticación JWT.

## Backend (`backend/`)
- Express + PostgreSQL con controladores stub.
- Rutas públicas: `/api/cases/search` para consulta por expediente o código de seguimiento.
- Rutas admin: CRUD de casos, timeline, documentos, pagos y usuarios con middlewares `authenticate` y `authorize` (roles `admin` y `super_admin`).
- Variables de entorno de ejemplo en `.env.example`.
- Datos de muestra en memoria (no persistentes) para experimentar con las rutas y credenciales por defecto `admin@example.com` / `admin123` (rol `super_admin`).

## Frontend (`frontend/`)
- Vite + React + React Router.
- Pantalla pública de búsqueda de expediente y página de detalle de caso.
- Panel admin con listado de casos y formulario básico de edición/creación.

## Próximos pasos sugeridos
- Conectar controladores a la base de datos PostgreSQL usando consultas parametrizadas.
- Añadir gestión real de archivos para documentos y comprobantes.
- Implementar flujos completos de autenticación y guardado de JWT en el cliente.
- Completar validaciones y manejo de errores.
