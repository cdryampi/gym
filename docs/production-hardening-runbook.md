# Runbook de produccion

## Gates previos

Ejecutar desde la raiz:

```powershell
pnpm install --frozen-lockfile
pnpm quality:prod
pnpm exec playwright test tests/e2e/production-critical.spec.ts
```

En `apps/medusa`:

```powershell
$env:TEST_TYPE = "unit"
$env:NODE_OPTIONS = "--experimental-vm-modules"
npx jest --silent --runInBand --forceExit
npm run build
npm audit --audit-level=high
```

Los bloqueantes son: lint con warnings, fallo de tipos/tests/build, cobertura por debajo de
60% en lineas/funciones/statements o 50% en branches, cualquier vulnerabilidad alta/critica,
o secretos detectados. Los modulos criticos declarados en `vitest.config.ts` exigen al menos
80% de lineas y branches.

## Orden de despliegue

1. Publicar Medusa en Dokploy con una sola replica. El contenedor ejecuta las migraciones Medusa de forma atomica antes de arrancar.
2. Exigir `GET https://gym.yampi.eu/health` con 200 y cuerpo con `status=healthy` y
   `service=gym-medusa`.
3. Verificar catalogo, enlace Medusa-Supabase y reserva pickup. No usar fallback legacy.
4. Validar la preview de Vercel con los E2E criticos, headers y una cuenta QA temporal.
5. Fusionar la PR para desplegar Next.js en Vercel.
6. Ejecutar smoke de home, tienda, producto, acceso, dashboard, miembros, carrito y pickup.
   PayPal se mantiene sin cargos reales.

## Monitorizacion de 30 minutos

Tomar una muestra cada tres minutos (diez en total):

```powershell
Measure-Command { Invoke-WebRequest -UseBasicParsing "https://gym.yampi.eu/health" }
Measure-Command { Invoke-WebRequest -UseBasicParsing "https://nuovaforzagym.com/tienda" }
```

Revisar en paralelo errores nuevos/repetidos en Vercel y logs del servicio en Dokploy.
Revertir si falla un flujo critico, `/health` deja de responder, aparece un error nuevo
repetido o la mediana de latencia empeora mas del 20% respecto del baseline.

## Rollback

- Medusa: redeploy de la revision estable anterior en Dokploy y confirmar `/health`.
- Web: rollback/promote de la deployment estable anterior en Vercel.
- Base de datos: el upgrade Medusa aplica sus migraciones oficiales con `--all-or-nothing` y
  safe links antes del arranque. El rollback de aplicacion no revierte esas migraciones; confirmar
  compatibilidad hacia atras antes del deploy. Las migraciones propias siguen limitadas a cambios
  aditivos/RLS con dry-run y SQL inverso preparado.
- Tras el rollback, repetir los smoke y conservar logs/metricas del incidente.

## Limpieza

Eliminar el socio QA temporal, carritos/reservas de prueba y artefactos locales bajo
`test-results/`, `playwright-report/` y `coverage/`. Nunca guardar tokens o credenciales en el
repositorio, logs o mensajes de la PR.
