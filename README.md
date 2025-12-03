# Proyecto denuncias-web

Estructura base para un sistema de gestión de denuncias con backend en Node.js/Express y frontend en Next.js. Incluye endpoints públicos para consulta de expedientes y panel de administración con autenticación JWT.

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
   # o
   npm run seed
   ```

4. Arrancar el servidor
   ```bash
   npm run dev
   ```

### Pagos
- Nuevos modelos gestionados por Prisma: `BankAccount`, `CryptoWallet`, `PaymentRequest` y `Payment`.
- Los estados de solicitudes y pagos se almacenan como texto (en lugar de enums nativos) para garantizar compatibilidad con SQLite.
- Estados y transiciones principales:
  - `PaymentRequest`: `PENDING` → `SENT` → `PAID_UNDER_REVIEW` → `PAID/APPROVED`; en revisión el admin puede pasar a `REJECTED`, `CANCELLED` o `EXPIRED`.
  - `Payment`: `PENDING` / `PENDING_REVIEW` → `APPROVED` o `REJECTED` (las aprobaciones sincronizan la solicitud con estado pagado).
- Endpoints admin para pagos:
  - `GET /api/admin/payment-requests` (listado global)
  - `POST /api/admin/payment-requests` (creación global vinculada a un caso)
  - `GET /api/admin/payments` (listado global)
  - `POST /api/admin/payments` (registro de pago global)
  - `GET /api/admin/cases/:caseId/payments`
  - `POST /api/admin/cases/:caseId/payment-requests`
  - `PATCH /api/admin/payment-requests/:id`
  - `POST /api/admin/cases/:caseId/payments`
  - `PATCH /api/admin/payments/:id`
- Revisión y recursos:
  - `POST /api/admin/payments/:id/review` para aprobar/rechazar pagos enviados por ciudadanos.
  - `GET /api/admin/payment-resources` para cargar casos, cuentas y wallets disponibles.
- Métodos auxiliares: `GET /api/admin/bank-accounts`, `GET /api/admin/crypto-wallets`, `GET /api/admin/payment-resources`
- CRUD de métodos de cobro:
  - `POST /api/admin/bank-accounts`, `PUT /api/admin/bank-accounts/:id`, `DELETE /api/admin/bank-accounts/:id`
  - `POST /api/admin/crypto-wallets`, `PUT /api/admin/crypto-wallets/:id`, `DELETE /api/admin/crypto-wallets/:id`
- Ejemplos de recursos válidos (semilla `npm run prisma:seed`):
  - Cuenta bancaria: `{ label: "Cuenta EUR Principal", bankName: "Banco Nacional", iban: "ES9820385778983000760236", currency: "EUR", country: "ES" }`
  - Wallet cripto: `{ label: "USDT TRC20 Principal", asset: "USDT", currency: "USDT", network: "TRC20", address: "TK8C2pQpExampleTRC20Wallet" }`
- Flujo ciudadano:
  - `POST /api/public/payment-requests/:id/confirm` permite a un ciudadano marcar un pago como realizado adjuntando comprobante.
  - En la página pública del expediente se muestran todas las solicitudes con su estado normalizado (Pendiente, En revisión, Aprobado, Rechazado, Vencido) y se indica si ya se envió comprobante.
  - Solo se admite un comprobante por solicitud; si ya existe un `Payment` ligado, el backend devuelve un error claro y la UI muestra el resumen en lugar del formulario.
  - Los comprobantes se guardan como documentos privados y quedan pendientes de revisión de un administrador.
- Eventos de timeline: la creación de solicitudes, el envío de comprobantes y las aprobaciones/rechazos generan eventos automáticos (`PAYMENT_REQUEST_CREATED`, `PAYMENT_CONFIRMATION_SUBMITTED`, `PAYMENT_APPROVED`, `PAYMENT_REJECTED`) visibles en la línea de tiempo del caso.
- Cada vez que cambies el esquema de Prisma, ejecuta `npm run prisma:migrate` (o `npx prisma migrate dev --name <cambio>`) para aplicar las migraciones y actualizar la base de datos local.
- Si no ves cuentas bancarias o wallets en el panel `/admin/payments`, ejecuta `npm run prisma:seed` tras migrar para volver a cargar los datos de ejemplo (cuentas SEPA y wallets cripto).

## Frontend Next.js (`web/`)
- Next.js 14 con App Router, TypeScript y Tailwind CSS.
- Rutas públicas: `/` (búsqueda de expediente) y `/cases/[id]` (detalle por código de seguimiento), organizadas en `app/(public)` con el layout institucional (`app/(public)/layout.tsx`).
- Rutas admin: `/admin/login`, `/admin/cases`, `/admin/cases/new`, `/admin/cases/[id]` bajo `app/(admin)/admin` con sidebar y cabecera en `app/(admin)/admin/layout.tsx`.
- Nueva vista `/admin/payments` para que los administradores consulten todas las solicitudes y pagos, creen nuevas solicitudes asociadas a un caso, actualicen estados, asignen cuentas bancarias o wallets cripto, visualicen códigos QR y revisen/validen comprobantes enviados por ciudadanos.
- Cliente API en `web/lib/api.ts` que consume el backend Express (puedes ajustar la URL con `NEXT_PUBLIC_API_BASE_URL`).
- `next.config.mjs` incluye un rewrite para apuntar `/api/*` al backend en `localhost:4000` por defecto.

### Puesta en marcha del frontend
1. Instalar dependencias
   ```bash
   cd web
   npm install
   ```

2. Definir la URL del backend (opcional)
   ```bash
   export NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
   ```

3. Levantar el servidor de desarrollo
   ```bash
   npm run dev
   ```

> El frontend previo en `frontend/` (Vite + React) se conserva solo como referencia durante la migración.

## Próximos pasos sugeridos
- Conectar controladores a la base de datos PostgreSQL usando consultas parametrizadas.
- Añadir gestión real de archivos para documentos y comprobantes.
- Implementar flujos completos de autenticación y guardado de JWT en el cliente.
- Completar validaciones y manejo de errores.
