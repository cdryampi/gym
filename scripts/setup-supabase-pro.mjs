import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parser manual de .env para evitar dependencias externas
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
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupStorage() {
  console.log('--- Configurando Storage Buckets ---');
  const buckets = ['routine-assets', 'product-images'];
  
  for (const bucketName of buckets) {
    const { error } = await supabase.storage.getBucket(bucketName);
    
    if (error && error.message.toLowerCase().includes('not found')) {
      console.log(`Creando bucket: ${bucketName}...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      if (createError) console.error(`Error al crear ${bucketName}:`, createError.message);
      else console.log(`Bucket ${bucketName} creado con exito.`);
    } else {
      console.log(`Bucket ${bucketName} ya existe o esta operativo.`);
    }
  }
}

async function checkRolesLogic() {
  console.log('\n--- Verificando Logica de Roles ---');
  const testUserId = '00000000-0000-0000-0000-000000000000';
  
  await supabase.from('user_roles').delete().eq('user_id', testUserId).eq('role', 'app_blocked');
  
  const { error } = await supabase.from('user_roles').insert({
    user_id: testUserId,
    role: 'app_blocked',
    note: 'Prueba de sistema Pro'
  });

  if (error) {
    console.error('Error al insertar rol app_blocked:', error.message);
  } else {
    console.log('Rol app_blocked operativo.');
    await supabase.from('user_roles').delete().eq('user_id', testUserId).eq('role', 'app_blocked');
  }
}

async function main() {
  try {
    await setupStorage();
    await checkRolesLogic();
    console.log('\nConfiguracion completada.');
  } catch (err) {
    console.error('Fallo critico:', err.message);
  }
}

main();
