/**
 * Script de sincronizacion — ejecutar cada vez que se agreguen empresas
 * Uso: node scripts/seed.mjs
 *
 * Preserva el campo `status` de las empresas que ya existen en la DB.
 * Solo inserta nuevas o actualiza campos de datos (nunca pisa status/notas de trabajo).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');

const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env['VITE_SUPABASE_URL'];
const key = env['VITE_SUPABASE_ANON_KEY'];

if (!url || !key) {
  console.error('Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

const leerConstante = (archivo) => {
  const contenido = readFileSync(join(__dir, '..', 'src', 'constants', archivo), 'utf-8');
  const match = contenido.match(/export const \w+ = (\[[\s\S]*\]);/);
  if (!match) throw new Error(`No se pudo parsear ${archivo}`);
  return eval(match[1]);
};

const bares        = leerConstante('bares.js');
const construccion = leerConstante('construccion.js');
const fabricas     = leerConstante('fabricas.js');
const reclutadoras = leerConstante('reclutadoras.js');

const mapear = (sector) => (item) => ({
  id:             item.id,
  sector,
  nombre:         item.nombre,
  email:          item.email || '',
  direccion:      item.direccion || '',
  barrio:         item.barrio || '',
  lat:            item.lat ?? null,
  lng:            item.lng ?? null,
  // status se preserva abajo — este es el valor por defecto para nuevas entradas
  status:         item.status || 'Pendiente',
  email_verified: item.emailVerified ?? null,
  hidden:         item.hidden ?? false,
  notas:          item.notas || '',
});

const todasLasFilas = [
  ...bares.map(mapear('bares')),
  ...construccion.map(mapear('construccion')),
  ...fabricas.map(mapear('fabricas')),
  ...reclutadoras.map(mapear('reclutadoras')),
];

console.log(`Leyendo estado actual de la DB...`);

// obtiene los status actuales para no pisarlos
const { data: existentes, error: errExist } = await supabase
  .from('empresas')
  .select('id, status');

if (errExist) {
  console.error('Error leyendo DB:', errExist.message);
  process.exit(1);
}

const statusActual = Object.fromEntries((existentes ?? []).map(e => [e.id, e.status]));
const idsExistentes = new Set(Object.keys(statusActual));

const nuevas    = todasLasFilas.filter(f => !idsExistentes.has(f.id));
const existentesFils = todasLasFilas
  .filter(f => idsExistentes.has(f.id))
  // preserva el status que ya tiene en la DB
  .map(f => ({ ...f, status: statusActual[f.id] }));

console.log(`  ${idsExistentes.size} existentes | ${nuevas.length} nuevas`);

// actualiza existentes (preservando status)
const LOTE = 100;
if (existentesFils.length > 0) {
  console.log(`Actualizando ${existentesFils.length} registros existentes...`);
  for (let i = 0; i < existentesFils.length; i += LOTE) {
    const lote = existentesFils.slice(i, i + LOTE);
    const { error } = await supabase.from('empresas').upsert(lote, { onConflict: 'id' });
    if (error) {
      console.error(`Error actualizando lote ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`  ok`);
}

// inserta nuevas
if (nuevas.length > 0) {
  console.log(`Insertando ${nuevas.length} registros nuevos...`);
  for (let i = 0; i < nuevas.length; i += LOTE) {
    const lote = nuevas.slice(i, i + LOTE);
    const { error } = await supabase.from('empresas').insert(lote);
    if (error) {
      console.error(`Error insertando lote ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`  ok`);
}

console.log('Sync completo.');
