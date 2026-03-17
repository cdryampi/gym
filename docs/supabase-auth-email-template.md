# Plantilla de confirmación de cuenta

La plantilla HTML lista para usar está en:

- `supabase/templates/confirm-signup.html`

## Uso en Supabase

1. Abre `Authentication`.
2. Entra en `Templates`.
3. Edita la plantilla `Confirm signup`.
4. Sustituye el HTML actual por el contenido de `supabase/templates/confirm-signup.html`.
5. Subject recomendado:
   - `Confirma tu cuenta en Nova Forza`

## Placeholders usados

- `{{ .ConfirmationURL }}`
- `{{ if .Email }}{{ .Email }}{{ end }}`

## Objetivo del diseño

- Correo más claro y menos genérico.
- CTA principal visible.
- Copy en español alineado con la marca del gimnasio.
- Fallback con enlace plano por si el botón falla.
