# Panel de Diagnóstico Técnico

Este documento describe la funcionalidad y el uso del panel de diagnóstico interno del dashboard.

## Información General

- **Ruta**: `/dashboard/developer/diagnostics`
- **Acceso**: Restringido exclusivamente a usuarios con rol `superadmin`.
- **Objetivo**: Proporcionar una forma rápida y segura de validar la configuración de servicios externos (Supabase, Firebase, Medusa, SMTP, PayPal) sin necesidad de revisar logs del servidor o acceder a entornos de nube directamente.

## Servicios Comprobados

### 1. Supabase
- **Configuración**: Verifica si las variables públicas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) están presentes.
- **Conectividad**: Realiza una consulta mínima (`head` request) a la tabla `user_roles` usando el `service_role` para validar permisos administrativos.
- **Si falla**: Revisar que `SUPABASE_SECRET_KEY` sea correcto y que el proyecto en Supabase esté activo.

### 2. Firebase Admin
- **Configuración**: Valida la presencia de `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`.
- **Conectividad**: Intenta inicializar la aplicación Admin SDK.
- **Si falla**: Verificar que el JSON de la cuenta de servicio de Firebase coincida con las variables de entorno.

### 3. Medusa Storefront
- **Configuración**: Valida `NEXT_PUBLIC_MEDUSA_BACKEND_URL` y `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
- **Conectividad**: Solicita un listado mínimo de productos públicos.
- **Si falla**: Asegurarse de que el servidor de Medusa v2 esté corriendo y sea accesible desde el frontend.

### 4. Medusa Admin
- **Configuración**: Valida `MEDUSA_ADMIN_API_KEY`.
- **Conectividad**: Intenta listar productos desde la API administrativa.
- **Si falla**: Verificar que la API Key sea válida y tenga permisos suficientes en Medusa.

### 5. SMTP (Email)
- **Configuración**: Detecta la presencia de host, puerto, usuario y contraseña.
- **Prueba**: Actualmente solo detecta configuración. La prueba de envío real debe realizarse mediante flujos de negocio (ej. recuperación de contraseña).

### 6. PayPal
- **Configuración**: Valida el Client ID y Secret.
- **Ambiente**: Indica si se está operando en `sandbox` o `production`.

## Qué NO comprueba el panel
- No realiza envíos de email reales (para evitar spam o cargos).
- No realiza cobros ni transacciones reales en PayPal.
- No valida la integridad total de los datos en la DB, solo la conectividad.

## Seguridad

> [!CAUTION]
> **NUNCA** compartas capturas de pantalla de los resultados de diagnóstico si contienen mensajes de error detallados, ya que podrían revelar detalles técnicos de la infraestructura.
> El panel está diseñado para **NO MOSTRAR** secretos (keys, passwords) en la UI en ningún momento.

## Solución de Problemas Comunes

- **"Falta Configuración"**: La variable de entorno no está definida en el servidor (revisar `.env.local` o panel de Dokploy/Vercel).
- **"Error al conectar"**: El servicio está caído, la URL es incorrecta o los secretos han expirado.
- **"Acceso Denegado"**: Tu usuario no tiene el nivel de permiso `superadmin`.
