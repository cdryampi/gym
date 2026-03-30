# Frontera entre auth del socio y modulo de Miembros

Decision document para evitar que `mi-cuenta`, `auth` y el futuro modulo `Miembros` se sigan usando como si fueran la misma cosa.

## Objetivo

Dejar una frontera clara, util y reutilizable para futuras tareas del roadmap.

La pregunta que este documento responde es:

- que pertenece a la cuenta privada del socio
- que pertenece al futuro modulo operativo de miembros

## Decision central

`Auth del socio` y `Miembros` son conceptos distintos.

- `auth del socio` es identidad de acceso a la web privada
- `Miembros` es una entidad operativa del negocio gestionada por el gimnasio

`/mi-cuenta` pertenece hoy a la capa de acceso privado del socio.
No es el modulo de `Miembros`.

## Que si es auth del socio

La cuenta/auth actual cubre:

- registro e inicio de sesion
- sesion activa y cierre de sesion
- identidad basica del usuario autenticado
- acceso a `/mi-cuenta`
- lectura privada ligera de informacion propia
- continuidad de flujos ya activos del core, como carrito y pedidos pickup

En terminos tecnicos, esta capa vive alrededor de:

- Supabase Auth
- `requireMemberUser`
- rutas privadas como `/mi-cuenta`
- componentes de acceso y sesion

## Que no es auth del socio

La cuenta actual no debe representar por si sola:

- condicion de socio activo
- alta, pausa o baja de un miembro
- plan operativo contratado
- observaciones internas del staff
- historial administrativo del club
- permisos internos del gimnasio

Que una persona tenga login no significa que ya sea un miembro operativo.

## Que si sera el modulo de Miembros

`Miembros` debe nacer como modulo interno del negocio.

Debe cubrir:

- ficha operativa del socio
- estado del miembro
- plan o referencia operativa asociada
- trazabilidad interna
- vinculacion opcional con una cuenta autenticada

En terminos tecnicos, ese modulo deberia vivir en:

- admin + Supabase
- tablas propias como `member_profiles`
- relaciones opcionales con `supabase_user_id`

## Regla de relacion entre ambos

La relacion correcta es `cuenta de acceso -> 0..1 ficha de miembro`.

Eso implica:

- no toda cuenta autenticada crea un miembro
- no toda ficha de miembro necesita login
- la vinculacion entre ambas debe ser explicita

## Donde cae cada tarea futura

### Cae en auth / mi-cuenta

Si la tarea trata de:

- login, registro o recuperacion de acceso
- sesion, proveedor de acceso o cierre de sesion
- datos visibles de cuenta
- historial privado de pedidos pickup
- lectura privada ligera de elementos propios

entonces pertenece a `auth` o `mi-cuenta`.

### Cae en Miembros

Si la tarea trata de:

- ficha del socio
- estado del miembro
- alta, pausa, baja o reactivacion
- plan operativo asignado
- notas internas del staff
- operacion administrativa del club

entonces pertenece al futuro modulo `Miembros`.

## Impacto en superficies actuales

### `/mi-cuenta`

`/mi-cuenta` debe seguir siendo una superficie privada ligera.

Puede mostrar:

- cuenta basica
- sesion y seguridad
- accesos utiles
- carrito activo
- historial pickup

No debe convertirse todavia en:

- ficha operativa completa del socio
- panel administrativo del miembro
- modulo profundo de membresias

### Dashboard

El dashboard actual puede seguir gestionando auth o accesos solo si eso afecta al funcionamiento del core.

El futuro modulo `Miembros` debera tener su propia superficie operativa cuando exista.

### Discovery y roadmap

Cada issue nueva debe ubicarse en una de estas dos familias:

- `Mi cuenta v2` si mejora la experiencia privada ligera del usuario autenticado
- `Miembros` si abre o amplía gestion operativa del socio como entidad del negocio

## Reglas de naming recomendadas

Para evitar mezcla conceptual:

- usar `user`, `account`, `auth`, `member session` o `private account` cuando se habla de acceso
- usar `member`, `member profile` o `member status` cuando se habla de la entidad operativa

Evitar:

- llamar `miembro` a cualquier usuario autenticado
- usar `mi-cuenta` como sinónimo de ficha operativa del socio
- usar `auth` como si ya resolviera el estado de negocio del socio

## Criterios para futuras tareas

Antes de abrir una issue nueva, comprobar estas preguntas:

1. ¿Esto solo mejora acceso o lectura privada del usuario?
2. ¿Esto introduce estado operativo del socio para el staff?
3. ¿Esto exige una ficha interna aunque la persona no tenga login?

Si la respuesta fuerte es la 1, cae en `mi-cuenta`.
Si la respuesta fuerte es la 2 o la 3, cae en `Miembros`.

## Decision de alcance

La cuenta privada actual sigue siendo una capa de acceso y consulta ligera.

El futuro modulo `Miembros` sigue siendo un modulo operativo separado.

No debemos mezclar ambos conceptos en roadmap, copy tecnico ni futuras implementaciones.
