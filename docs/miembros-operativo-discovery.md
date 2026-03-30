# Discovery del modulo Miembros operativo

Discovery decision-complete para definir el futuro modulo `Miembros` del negocio sin mezclarlo con la cuenta de acceso actual, `mi-cuenta`, leads, reservas ni rutinas.

## Objetivo

Definir una propuesta implementable para `Miembros` que responda a estas preguntas:

- que representa exactamente un miembro en el negocio
- cual es su ficha interna minima
- como se modela su estado
- como se relaciona con plan, auth actual y otros modulos
- que queda fuera de la primera fase

## Decision central

`Miembros` debe nacer como un modulo operativo interno del gimnasio, no como una extension de `auth` ni como una pagina privada del socio.

En otras palabras:

- `auth actual` identifica a una persona con acceso privado a la web
- `miembro operativo` representa una relacion de negocio gestionada por el club

Una persona puede tener cuenta sin ser miembro operativo.
Un miembro operativo puede existir sin usar todavia el acceso privado.

## Problema que si resuelve

Hoy el proyecto tiene:

- auth de Supabase
- `mi-cuenta` como superficie privada ligera
- leads
- commerce pickup

Pero no tiene una entidad clara para responder internamente:

- quien es socio activo, pausado o dado de baja
- que plan tiene contratado
- desde cuando esta vigente
- que contexto operativo necesita el staff

El modulo `Miembros` debe cubrir esa necesidad interna del negocio.

## Frontera del modulo

`Miembros` cae primero en `admin + Supabase`.

- `admin`: fuente principal de operacion
- `Supabase`: fuente de verdad de la ficha, estado y vinculaciones
- `mi-cuenta`: solo podra consumir parte de esa informacion mas adelante
- `Medusa`: no es fuente de verdad del modulo

## Relacion con auth actual

### Lo que si es auth actual

- identidad de acceso
- email y proveedor de login
- sesion
- entrada a `/mi-cuenta`

### Lo que no es auth actual

- estado de socio
- plan del gimnasio
- historial operativo del club
- observaciones internas
- suspension o baja del servicio

### Relacion recomendada

Relacion 1 a 0..1 entre `supabase_user_id` y `member_profile`.

Reglas:

- `supabase_user_id` es opcional en la ficha de miembro
- no toda cuenta autenticada debe crear un miembro
- no toda ficha de miembro exige cuenta creada
- cuando existan ambas, se vinculan explicitamente

## Relacion con otros modulos

### Mi cuenta

- `mi-cuenta` sigue siendo superficie privada ligera
- no se convierte en el modulo de Miembros
- solo podra exponer una vista resumida del estado del socio si eso aporta valor real

### Leads

- un lead puede terminar convirtiendose en miembro
- la conversion debe ser un paso explicito, no una mutacion silenciosa del lead
- relacion sugerida: `origin_lead_id` opcional en la ficha de miembro

### Reservas

- una reserva puede estar asociada a un miembro o a un invitado
- `Reservas` no debe depender de `Miembros` para existir
- relacion sugerida futura: `member_id` opcional en `reservations`

### Rutinas

- `Rutinas` puede depender de `Miembros` mas adelante
- `Miembros` no debe depender de `Rutinas` para existir

### Planes

- el miembro puede tener un plan comercial u operativo asignado
- eso no obliga a que `Planes` deje ya de ser contenido hoy
- mientras no exista entidad de negocio para planes, el miembro puede guardar un `plan_label` o `plan_code` interno simple

## Actores

### Staff del club

- consulta la ficha del miembro
- cambia estado
- asigna o corrige plan
- revisa notas internas y trazabilidad

### Socio con cuenta

- puede ver una parte resumida de su situacion mas adelante
- no administra la ficha operativa completa

### Invitado o lead

- aun no es miembro operativo
- puede convertirse despues de una decision comercial o administrativa

## Ficha minima propuesta

Entidad principal sugerida: `member_profiles`

Campos minimos:

- `id`
- `member_number`
- `full_name`
- `email`
- `phone`
- `document_type`
- `document_number`
- `birth_date`
- `emergency_contact_name`
- `emergency_contact_phone`
- `plan_label`
- `status`
- `join_date`
- `pause_starts_at` nullable
- `pause_ends_at` nullable
- `cancelled_at` nullable
- `origin_lead_id` nullable
- `supabase_user_id` nullable
- `notes`
- `internal_notes`
- `created_at`
- `updated_at`

## Estados minimos

Estados recomendados para v1:

- `prospect`
- `active`
- `paused`
- `cancelled`
- `former`

### Semantica

- `prospect`: ya existe ficha interna, pero aun no se considera socio activo
- `active`: socio operativo vigente
- `paused`: relacion activa pero temporalmente congelada
- `cancelled`: baja formal o cancelacion del servicio
- `former`: estado historico para casos antiguos o migrados

## Relacion con plan

La primera version no necesita un modulo completo de planes de negocio.

Decision recomendada:

- guardar `plan_label` como texto controlado o enum corto
- permitir evolucion posterior a `plan_id` cuando el modulo de Planes lo justifique

Esto evita bloquear `Miembros` por una dependencia que hoy todavia no esta cerrada.

## Superficies minimas

### Admin

Ruta sugerida:

- `/dashboard/miembros`

Contenido minimo:

- listado con nombre, plan, estado y fecha de alta
- filtros por estado y plan
- ficha de detalle
- acciones de estado

### Mi cuenta

No abrir ficha completa del miembro aqui.

Solo preparar una lectura resumida futura:

- estado visible del socio
- plan actual visible
- fecha de vigencia o situacion

### Web publica

No requiere superficie propia.

## Conversiones y entradas al modulo

Entradas validas a `Miembros`:

- alta manual por staff
- conversion desde lead
- vinculacion posterior con una cuenta de auth existente

No debe crearse un miembro automaticamente:

- por registrarse en la web
- por abrir `mi-cuenta`
- por hacer un pedido pickup

## Riesgos a evitar

- llamar "miembro" a cualquier usuario autenticado
- mezclar ficha operativa con perfil publico de cuenta
- depender de Medusa para informacion de socio
- exigir rutinas o reservas para modelar al miembro
- bloquear el modulo por no tener aun entidad formal de planes

## Propuesta de implementacion por fases

### Fase A

- tabla `member_profiles`
- listado admin
- ficha minima
- estados y plan simple

### Fase B

- conversion lead -> miembro
- vinculacion opcional con `supabase_user_id`
- resumen visible en `mi-cuenta`

### Fase C

- historial operativo ampliado
- integracion con reservas y rutinas
- plan como entidad formal si el negocio lo exige

## Decision de alcance

`Miembros` debe construirse como modulo operativo interno del gimnasio, separado de `auth` y separado de `mi-cuenta`.

La cuenta privada actual sigue siendo una capa de acceso.
El modulo de miembros representa la relacion de negocio y la ficha operativa del socio.
