export function useExportCSV() {
  const exportarCSV = (datos, sector, estadoFiltrado) => {
    const filtrado = estadoFiltrado ? datos.filter(d => d.status === estadoFiltrado) : datos;

    const encabezado = ['Nombre', 'Email', 'Direccion', 'Barrio', 'Estado', 'Email Verificado', 'Notas'];
    const filas = filtrado.map(item => [
      item.nombre,
      item.email || '',
      item.direccion,
      item.barrio,
      item.status,
      item.emailVerified === true ? 'Si' : item.emailVerified === false ? 'No' : 'Sin email',
      item.notas || '',
    ]);

    const contenidoCSV = [encabezado, ...filas]
      .map(fila => fila.map(celda => `"${String(celda).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.setAttribute('href', url);
    enlace.setAttribute('download', `gold-coast-${sector}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  return { exportarCSV };
}
