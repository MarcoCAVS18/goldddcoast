import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseData(sector) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // carga datos desde Supabase al montar o cambiar de sector
  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setLoading(true);
      const { data: filas, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('sector', sector)
        .order('nombre', { ascending: true });

      if (!cancelado) {
        if (!error) setData(filas ?? []);
        setLoading(false);
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, [sector]);

  // mapea campos snake_case de Supabase a camelCase del componente
  const mapearFila = (fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    direccion: fila.direccion,
    barrio: fila.barrio,
    lat: fila.lat,
    lng: fila.lng,
    status: fila.status,
    emailVerified: fila.email_verified,
    hidden: fila.hidden,
    notas: fila.notas,
    sector: fila.sector,
  });

  const actualizarItem = useCallback(async (id, cambios) => {
    // convierte camelCase a snake_case para Supabase
    const payload = {};
    if ('emailVerified' in cambios) payload.email_verified = cambios.emailVerified;
    if ('nombre'       in cambios) payload.nombre        = cambios.nombre;
    if ('email'        in cambios) payload.email         = cambios.email;
    if ('direccion'    in cambios) payload.direccion     = cambios.direccion;
    if ('barrio'       in cambios) payload.barrio        = cambios.barrio;
    if ('lat'          in cambios) payload.lat           = cambios.lat;
    if ('lng'          in cambios) payload.lng           = cambios.lng;
    if ('status'       in cambios) payload.status        = cambios.status;
    if ('hidden'       in cambios) payload.hidden        = cambios.hidden;
    if ('notas'        in cambios) payload.notas         = cambios.notas;

    const { data: actualizada, error } = await supabase
      .from('empresas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!error && actualizada) {
      setData(prev => prev.map(item => item.id === id ? mapearFila(actualizada) : item));
    }
  }, []);

  const crearItem = useCallback(async (nuevoItem) => {
    const payload = {
      sector,
      nombre:        nuevoItem.nombre,
      email:         nuevoItem.email || '',
      direccion:     nuevoItem.direccion || '',
      barrio:        nuevoItem.barrio || '',
      lat:           nuevoItem.lat ?? -28.0020,
      lng:           nuevoItem.lng ?? 153.4298,
      status:        nuevoItem.status || 'Pendiente',
      email_verified: nuevoItem.email ? false : null,
      hidden:        false,
      notas:         nuevoItem.notas || '',
    };

    const { data: creada, error } = await supabase
      .from('empresas')
      .insert(payload)
      .select()
      .single();

    if (!error && creada) {
      setData(prev => [...prev, mapearFila(creada)]);
    }
  }, [sector]);

  const resetearDatos = useCallback(() => {
    // no aplica en Supabase, la fuente de verdad es la DB
    console.warn('resetearDatos no tiene efecto con Supabase');
  }, []);

  return { data, actualizarItem, crearItem, resetearDatos, loading };
}
