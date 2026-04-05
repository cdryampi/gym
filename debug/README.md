# Debug Workspace

Usa esta carpeta para cualquier artefacto temporal de depuracion del proyecto y evita crear archivos sueltos en la raiz o dentro de `apps/medusa`.

## Reglas

- Guarda salidas de debugging funcional en `debug/medusa/` u otra subcarpeta especifica si mas adelante hiciera falta.
- Guarda logs del sistema, procesos o volcados de consola en `debug/sys-logs/`.
- No referencies estos archivos desde codigo de produccion.
- Si un archivo solo sirve para una sesion puntual, borralo cuando termine la depuracion.

## Nota de Git

El repositorio versiona este `README.md` y los placeholders de carpetas, pero ignora el contenido real de `debug/` para que no subamos residuos a GitHub.
