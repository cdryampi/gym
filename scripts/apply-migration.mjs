import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Cargar variables de .env.local
function getEnv() {
  const content = readFileSync('.env.local', 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.join('=').trim();
    }
  });
  return env;
}

const env = getEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('--- Intentando aplicar migración financiera ---');
  const sql = readFileSync('supabase/migrations/202604210001_activate_financial_core.sql', 'utf8');
  
  // En Supabase, a menudo se configura una función RPC 'exec_sql' para automatización
  // Si no existe, intentaremos vía CLI o informaremos el método manual.
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
      console.log('Nota: La función RPC "exec_sql" no existe en este proyecto.');
      console.log('Intentando verificar si el CLI de Supabase está accesible mediante una ruta absoluta...');
      
      try {
        // Intento desesperado: buscar el binario en rutas comunes o usar npx local
        const output = execSync('npx supabase --version').toString();
        console.log('CLI detectado vía npx local:', output);
      } catch {
        console.error('No se pudo ejecutar vía RPC ni detectar CLI.');
      }
    } else {
      console.error('Error al ejecutar SQL:', error.message);
    }
  } else {
    console.log('Migración aplicada con éxito vía RPC.');
  }
}

applyMigration();
