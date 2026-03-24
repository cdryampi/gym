# Scripts operativos de Medusa

Este directorio ya no debe usarse como cajon de sastre para depuracion puntual.
Solo deben vivir aqui scripts con un uso operativo claro, repetible y documentado.

## Scripts que se conservan

- `seed.ts`
- `seed-nova-forza.ts`
- `verify-seed.ts`
- `setup-bucket.ts`
- `upload-images.ts`
- `sync-supabase.ts`
- `migrate-supabase.ts`

## Regla de mantenimiento

Si necesitas investigar algo puntual:

- usa una rama de trabajo o un archivo temporal ignorado
- no dejes dumps, fixes one-shot o probes SQL en el repo
- si el script es realmente util a futuro, documentalo aqui y dale un nombre estable

## Ejecucion

Los scripts se ejecutan con Medusa CLI:

```bash
npx medusa exec ./src/scripts/<archivo>.ts
```
