# Contrato de Importación de Socios mediante CSV

Este documento describe el formato y las reglas de validación obligatorias para realizar importaciones masivas de socios en el panel de administración.

## Estructura del Archivo

El archivo debe ser un documento de texto plano con codificación **UTF-8**, utilizando la **coma (`,`)** o el **punto y coma (`;`)** como separador de campos.

### Columnas Requeridas

| Columna | Formato / Reglas | Descripción |
| :--- | :--- | :--- |
| `email` | Correo electrónico válido (se convertirá a minúsculas y se limpiarán espacios). | Identificador de cuenta único para Firebase y Supabase. |
| `first_name` | Texto. No puede estar vacío. | Nombre(s) del socio. |
| `last_name` | Texto. No puede estar vacío. | Apellido(s) del socio. |
| `phone` | Dígitos numéricos (opcionalmente prefijo `+`). Mínimo 7 caracteres. | Teléfono de contacto del socio. |
| `membership_plan` | El `slug` de un plan de membresía activo en el sistema. | Plan al que se vinculará la membresía. |
| `membership_start_date` | Fecha en formato `YYYY-MM-DD`. | Fecha de inicio de la membresía. |
| `membership_end_date` | Fecha en formato `YYYY-MM-DD` o dejar vacío. | Fecha de vencimiento. Si se deja vacía, se calculará sumando los días de duración del plan a partir de la fecha de inicio. |
| `status` | Uno de: `active`, `inactive`, `frozen`. | Estado de la ficha del socio. |

### Columnas Opcionales

| Columna | Formato / Reglas | Descripción |
| :--- | :--- | :--- |
| `document_id` | Texto (ej: DNI o CE). | Documento de identidad del socio. |
| `birth_date` | Fecha en formato `YYYY-MM-DD` o vacío. | Fecha de nacimiento. |
| `address` | Texto o vacío. | Dirección de residencia. |
| `emergency_contact_name`| Texto o vacío. | Nombre del contacto de emergencia. |
| `emergency_contact_phone`| Texto o vacío. | Teléfono del contacto de emergencia. |
| `notes` | Texto o vacío. | Notas internas o de soporte para la ficha del socio. |
| `send_welcome_email` | `true` o `false` (por defecto `false`). | Indica si se debe intentar enviar un correo de bienvenida tras la creación en Firebase. |

---

## Reglas de Procesamiento e Idempotencia

1. **Idempotencia de Identidad (Firebase)**:
   - Si el correo electrónico **ya existe** en Firebase Auth, se reutilizará su `UID` sin alterar la contraseña actual ni modificar sus claims o roles (ej. si es staff, se mantendrá sin alteración).
   - Si el correo **no existe**, se creará la cuenta con una contraseña temporal generada aleatoriamente y segura.
2. **Idempotencia de Perfil (Supabase)**:
   - Si ya existe un perfil en `member_profiles` con ese correo o Firebase UID, se actualizarán los datos de contacto y la información demográfica proporcionada en el CSV, manteniendo el `member_number` original.
   - Si no existe, se creará un perfil nuevo y se generará un número de socio correlativo.
3. **Idempotencia de Membresía (Supabase)**:
   - Si el socio ya posee una membresía activa equivalente para el mismo plan y ciclo, el sistema **omitirá (`skipped`)** la creación de una nueva solicitud para evitar cobros duplicados.
   - Si no posee una activa, se insertará una solicitud en `membership_requests` con estado `active` y fuente `admin-csv-import`, y se actualizará su perfil con el plan activo.

## Errores y Advertencias Comunes

- **Error**: El plan especificado en `membership_plan` no existe o no está activo. (Fila rechazada).
- **Error**: Formato de fecha inválido. Las fechas deben ser estrictamente `YYYY-MM-DD`. (Fila rechazada).
- **Error**: Duplicados en el archivo. Múltiples filas del CSV contienen el mismo correo. (Filas duplicadas marcadas como error).
- **Advertencia**: Fila vacía. Se omitirá silenciosamente.
