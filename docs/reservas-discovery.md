# Discovery del modulo Reservas

Discovery decision-complete para abrir el modulo `Reservas` mas adelante sin mezclarlo con leads, miembros o rutinas antes de tiempo.

## Objetivo

Definir una primera propuesta implementable para `Reservas` en el contexto real del gimnasio local:

- que problema resuelve
- que actores intervienen
- donde vive la superficie
- cual es el modelo minimo
- que queda explicitamente fuera

## Decision central

`Reservas` debe nacer como un modulo de agenda operativa ligera para citas puntuales del club, no como un sistema completo de clases, aforo ni calendario de miembros.

La primera version debe cubrir:

- reserva de prueba
- visita guiada
- asesoria inicial

No debe cubrir todavia:

- reserva de sesiones de entrenamiento recurrentes
- agenda completa de coaches
- cupos avanzados por clase
- pagos de reservas
- automatizaciones complejas

## Problema que si resuelve

Hoy la web y el panel captan interes, muestran planes y horarios, pero no existe un flujo propio para convertir ese interes en una cita concreta con fecha y hora.

El modulo debe resolver este hueco:

1. una persona quiere agendar una prueba o visita
2. el club necesita confirmar, mover o cancelar esa cita
3. la operacion debe ver el estado y el historial sin depender de notas sueltas

## Frontera del modulo

Reservas cae en `web publica + admin`, con Supabase como backend principal.

- `web publica`: solicitud y consulta basica de una reserva propia
- `admin`: bandeja operativa, confirmacion, reprogramacion y cierre
- `Supabase`: fuente de verdad de reservas, tipos, slots y estado
- `Medusa`: no participa

## Relacion con otros modulos

### Leads

- una reserva puede nacer desde un lead, pero no debe vivir dentro de `leads`
- relacion sugerida: `lead_id` opcional
- si no existe lead previo, la reserva puede crear su propio contacto sin depender del modulo leads

### Mi cuenta

- una persona con cuenta puede ver sus reservas futuras y pasadas
- esto no convierte `mi-cuenta` en el modulo de Reservas
- la bandeja operativa y la logica principal siguen en admin

### Miembros

- `miembros` operativo es un modulo futuro distinto
- una reserva puede tener `supabase_user_id` o `member_id` en el futuro, pero no debe exigir ficha de miembro para existir

### Rutinas

- ninguna dependencia
- no usar reservas para modelar sesiones de rutina ni planificacion de entrenamiento

## Actores

### Invitado

- solicita una prueba o visita
- deja nombre, email, telefono y preferencia horaria

### Socio con cuenta

- solicita una asesoria o visita puntual desde una superficie privada futura o desde la web publica
- consulta sus reservas, pero no gestiona la agenda del club

### Staff del club

- confirma, reprograma, cancela o marca asistencia
- necesita leer rapidamente el estado y el contexto del contacto

## Flujo minimo recomendado

### Flujo publico

1. el usuario abre `Reservas` desde un CTA publico
2. elige un tipo de reserva
3. selecciona un slot disponible o deja una preferencia horaria
4. envia datos basicos de contacto
5. recibe estado inicial `requested`

### Flujo admin

1. el panel muestra una bandeja de reservas
2. el staff revisa tipo, fecha, contacto y origen
3. confirma, reprograma o cancela
4. despues de la cita, marca `attended` o `no_show`

### Flujo privado futuro

1. `mi-cuenta` lista reservas propias
2. el usuario puede ver estado, fecha y notas visibles
3. cualquier reprogramacion sigue pasando por reglas definidas del club, no por una agenda libre total

## Estados minimos

Estados recomendados para la primera implementacion:

- `requested`
- `confirmed`
- `rescheduled`
- `cancelled`
- `attended`
- `no_show`

Reglas:

- el estado inicial siempre es `requested`
- `confirmed` y `rescheduled` cuentan como futuras activas
- `attended` y `no_show` cierran operacion
- `cancelled` no debe borrarse; sirve para trazabilidad

## Modelo de datos minimo

### `reservation_types`

Catalogo pequeno y editable de tipos de reserva.

Campos minimos:

- `id`
- `slug`
- `name`
- `description`
- `duration_minutes`
- `is_active`
- `order`
- timestamps

Ejemplos:

- `trial-session`
- `guided-visit`
- `initial-assessment`

### `reservation_slots`

Slots concretos disponibles para reservar.

Campos minimos:

- `id`
- `reservation_type_id`
- `starts_at`
- `ends_at`
- `capacity`
- `reserved_count`
- `is_active`
- `notes`
- timestamps

Notas:

- para v1 basta con slots explicitos
- no hace falta abrir todavia una capa de reglas recurrentes complejas

### `reservations`

Entidad operativa principal.

Campos minimos:

- `id`
- `reservation_number`
- `reservation_type_id`
- `slot_id` nullable
- `status`
- `full_name`
- `email`
- `phone`
- `notes`
- `internal_notes`
- `source`
- `lead_id` nullable
- `supabase_user_id` nullable
- `requested_at`
- `confirmed_at` nullable
- `cancelled_at` nullable
- `attended_at` nullable
- `created_at`
- `updated_at`

## Superficies minimas

### Web publica

Ruta sugerida:

- `/reservas`

Contenido minimo:

- selector de tipo de reserva
- selector de slot o preferencia
- formulario corto
- confirmacion simple

### Admin

Ruta sugerida:

- `/dashboard/reservas`

Contenido minimo:

- listado con estado, tipo, fecha y contacto
- filtros por estado, tipo y fecha
- vista de detalle lateral o pagina
- acciones: confirmar, reprogramar, cancelar, marcar asistencia

### Mi cuenta

No abrir un submodulo completo en la primera fase.

Solo preparar mas adelante:

- lista de reservas propias
- estado
- fecha y hora
- instrucciones visibles

## Integracion con el core actual

### Donde encaja

- complementa leads y marketing
- complementa `mi-cuenta`
- crea una nueva superficie operativa clara en admin

### Donde no encaja

- no pertenece a tienda
- no pertenece a Medusa
- no debe reutilizar tablas de pickup
- no debe presentarse como “miembros”

## Riesgos a evitar

- abrir reservas como “clases” demasiado pronto
- mezclar reserva con lead en una sola tabla
- exigir auth para todo desde el dia uno
- modelar recurrencia, coaches y salas antes de validar uso real
- usar un calendario complejo si una bandeja operativa ya cubre la necesidad inicial

## Propuesta de implementacion por fases

### Fase A

- `reservation_types`
- `reservation_slots`
- `reservations`
- ruta publica `/reservas`
- bandeja admin `/dashboard/reservas`

### Fase B

- vista privada en `mi-cuenta`
- notificaciones transaccionales simples
- reprogramacion con reglas controladas

### Fase C

- reglas recurrentes de slots
- capacidad avanzada
- ownership por coach o sede, si el negocio realmente lo necesita

## Decision de alcance

La implementacion futura debe tratar `Reservas` como modulo nuevo del dominio gym, con Supabase como fuente de verdad, y con una primera version enfocada en citas puntuales del club.

No debe empezar como agenda completa de miembros ni como sistema de clases.
