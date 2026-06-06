import { useState, useCallback, useEffect } from 'react';
import { bares as baresInit } from '../constants/bares';
import { construccion as construccionInit } from '../constants/construccion';
import { fabricas as fabricasInit } from '../constants/fabricas';

const STORAGE_KEYS = {
  bares: 'wgc_bares',
  construccion: 'wgc_construccion',
  fabricas: 'wgc_fabricas',
};

const INITIAL_DATA = {
  bares: baresInit,
  construccion: construccionInit,
  fabricas: fabricasInit,
};

const cargarDesdStorage = (sector) => {
  try {
    const almacenado = localStorage.getItem(STORAGE_KEYS[sector]);
    if (almacenado) {
      return JSON.parse(almacenado);
    }
  } catch {
    // si falla el parse usamos datos iniciales
  }
  return INITIAL_DATA[sector];
};

export function useLocalData(sector) {
  const [data, setData] = useState(() => cargarDesdStorage(sector));

  // recarga datos cuando cambia el sector
  useEffect(() => {
    setData(cargarDesdStorage(sector));
  }, [sector]);

  const guardarEnStorage = useCallback((nuevosDatos, sec) => {
    try {
      localStorage.setItem(STORAGE_KEYS[sec || sector], JSON.stringify(nuevosDatos));
    } catch {
      // storage lleno o bloqueado
    }
  }, [sector]);

  const actualizarItem = useCallback((id, cambios) => {
    setData(prev => {
      const actualizado = prev.map(item => item.id === id ? { ...item, ...cambios } : item);
      guardarEnStorage(actualizado);
      return actualizado;
    });
  }, [guardarEnStorage]);

  const crearItem = useCallback((nuevoItem) => {
    setData(prev => {
      const item = {
        ...nuevoItem,
        id: `custom_${Date.now()}`,
        status: nuevoItem.status || 'Pendiente',
        emailVerified: nuevoItem.email ? false : null,
        hidden: false,
        notas: nuevoItem.notas || '',
        lat: nuevoItem.lat || -28.0020,
        lng: nuevoItem.lng || 153.4298,
      };
      const actualizado = [...prev, item];
      guardarEnStorage(actualizado);
      return actualizado;
    });
  }, [guardarEnStorage]);

  const resetearDatos = useCallback(() => {
    const datosIniciales = INITIAL_DATA[sector];
    setData(datosIniciales);
    guardarEnStorage(datosIniciales);
  }, [sector, guardarEnStorage]);

  return { data, actualizarItem, crearItem, resetearDatos, loading: false };
}
