# Backlog corto de `mi-cuenta` que sigue siendo core

Documento de alcance para priorizar mejoras reales de `mi-cuenta` sin convertir esta superficie en un modulo sobredimensionado de miembros.

## Objetivo

Definir un backlog corto, claro y priorizado para `mi-cuenta`.

La regla principal es:

- mantener `mi-cuenta` como superficie privada ligera y util
- no adelantar aqui funcionalidades que en realidad pertenecen a `Miembros`, `Reservas` o `Rutinas`

## Estado actual

Hoy `mi-cuenta` ya cubre:

- cuenta basica visible
- sesion y seguridad
- accesos utiles
- carrito activo
- resumen e historial de pedidos pickup

Eso confirma que la superficie ya existe como parte del core, pero aun puede mejorar en algunos puntos pegados al flujo real del producto.

## Decision central

Las mejoras core de `mi-cuenta` deben centrarse en:

- continuidad del flujo pickup
- lectura privada clara
- ayudas y estados mas comprensibles

No deben centrarse en:

- ficha operativa del socio
- membresias complejas
- agenda o reservas completas
- rutinas
- CRM personal o centro de notificaciones grande

## Backlog corto recomendado

### Prioridad 1

#### 1. Detalle privado de pedido pickup

Ruta sugerida:

- `/mi-cuenta/pedidos/[id]`

Valor:

- permite pasar del resumen actual a trazabilidad real del pedido
- conecta mejor `mi-cuenta` con el flujo de confirmacion y seguimiento
- reduce ambiguedad despues de pagar

Notas:

- esto ya esta alineado con la issue `#30`
- sigue siendo core porque completa un flujo ya encendido

#### 2. Estados y ayudas mas claros en seguimiento pickup

Valor:

- explicar mejor `processing`, `manual_review`, errores y pasos siguientes
- reducir ansiedad del usuario cuando el pago o el email no quedan claros

Incluye:

- copy de estado
- mensajes de ayuda
- orientacion sobre que hacer si algo queda pendiente

Esto sigue siendo core porque mejora un flujo ya activo y con impacto directo en soporte.

### Prioridad 2

#### 3. Enlaces contextuales para retomar acciones utiles

Valor:

- permitir volver facilmente a carrito, tienda o detalle de pedido
- mantener la cuenta como hub ligero de continuidad

Incluye:

- CTA a carrito si existe compra abierta
- CTA al ultimo pedido
- CTA a tienda cuando no exista actividad reciente

#### 4. Empty states y mensajes de error mas robustos

Valor:

- que `mi-cuenta` no se sienta rota cuando falten pedidos, carrito o datos sincronizados
- hacer mas clara la diferencia entre vacio real y error recuperable

Incluye:

- mensajes vacios mejores
- advertencias de sincronizacion entendibles
- copy de soporte o siguiente paso cuando algo falla

### Prioridad 3

#### 5. Ajustes basicos de cuenta muy controlados

Valor:

- permitir pequenos ajustes utiles sin abrir un modulo de perfil complejo

Solo si el entorno lo necesita de verdad:

- nombre visible
- telefono de contacto
- confirmacion simple de email o proveedor de acceso

Condicion:

- no abrir preferencias extensas
- no mezclar esto con ficha de miembro

## Lo que queda fuera del core inmediato

Estas mejoras deben ir a backlog de expansion o al modulo correcto:

- estado de membresia o plan operativo del socio
- ficha completa de miembro
- reservas propias con gestion compleja
- rutinas asignadas
- pagos recurrentes o suscripciones
- metodos de pago guardados
- centro de notificaciones amplio
- soporte conversacional o seguimiento tipo CRM

## Regla de priorizacion

Si una mejora:

- completa pickup
- reduce soporte
- mejora comprension del estado
- aprovecha la sesion privada existente

entonces probablemente sigue siendo core de `mi-cuenta`.

Si una mejora:

- introduce logica de socio operativo
- depende de un modulo nuevo
- requiere entidad de negocio propia

entonces debe salir de `mi-cuenta` y caer en su modulo futuro.

## Propuesta de orden de trabajo

1. detalle privado de pedido pickup
2. mejora de estados y ayudas
3. accesos contextuales mas utiles
4. empty states y errores mas robustos
5. ajustes basicos muy controlados si queda una necesidad real

## Decision de alcance

`Mi-cuenta` sigue siendo core mientras actue como superficie privada ligera para acceso y continuidad de flujos ya activos, especialmente pickup.

En cuanto una mejora pida modelar la relacion de negocio del socio o abrir un dominio nuevo, deja de pertenecer a `mi-cuenta` y debe moverse al modulo correspondiente.
