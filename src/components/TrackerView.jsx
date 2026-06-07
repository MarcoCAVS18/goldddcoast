import { useState, useMemo } from 'react';
import {
  Search, Check, X, Edit3, Mail, Filter, EyeOff, Eye,
  CheckSquare, Square, Download, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import { useSupabaseData as useLocalData } from '../hooks/useSupabaseData';
import { useExportCSV } from '../hooks/useExportCSV';
import { STATUS_OPTIONS } from '../constants/statusOptions';
import SectorToggle from './SectorToggle';
import CreateCompanyModal from './CreateCompanyModal';
import Spinner from './Spinner';

const BARRIOS_GC = [
  'Surfers Paradise', 'Broadbeach', 'Burleigh Heads', 'Mermaid Beach',
  'Miami', 'Palm Beach', 'Currumbin', 'Southport', 'Main Beach',
  'Hope Island', 'Coolangatta', 'Robina', 'Bundall', 'Helensvale',
  'Coomera', 'Yatala', 'Currumbin Waters', 'Varsity Lakes', 'Kirra',
];

const TrackerView = () => {
  const [sector, setSector] = useState('bares');
  const { data, actualizarItem, crearItem, loading } = useLocalData(sector);
  const { exportarCSV } = useExportCSV();

  const [mostrarOcultos, setMostrarOcultos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [barriosFiltrados, setBarriosFiltrados] = useState([]);
  const [mostrarFiltroBarrio, setMostrarFiltroBarrio] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [emailCopiado, setEmailCopiado] = useState(null);
  const [todosCopiados, setTodosCopiados] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [idsSeleccionados, setIdsSeleccionados] = useState(new Set());
  const [modoBulk, setModoBulk] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editBarrio, setEditBarrio] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [editEmailVerified, setEditEmailVerified] = useState(null);
  const [estadoFiltrado, setEstadoFiltrado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const barriosUnicos = useMemo(() => {
    const barrios = [...new Set(data.map(d => d.barrio))];
    return barrios.sort();
  }, [data]);

  const itemsSeleccionados = useMemo(() => {
    if (!modoBulk || idsSeleccionados.size === 0) return [];
    return data.filter(d => idsSeleccionados.has(d.id));
  }, [modoBulk, idsSeleccionados, data]);

  const datosFiltrados = data.filter(d => {
    const coincideBusqueda =
      d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.barrio.toLowerCase().includes(busqueda.toLowerCase());
    const coincideBarrio = barriosFiltrados.length === 0 || barriosFiltrados.includes(d.barrio);
    const coincideEstado = !estadoFiltrado || d.status === estadoFiltrado;
    const noOculto = mostrarOcultos || !d.hidden;
    return coincideBusqueda && coincideBarrio && coincideEstado && noOculto;
  });

  const cantidadOcultos = data.filter(d => d.hidden).length;

  const conteoEstados = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, s) => {
      acc[s.label] = data.filter(d => d.status === s.label && !d.hidden).length;
      return acc;
    }, {});
  }, [data]);

  const copiarEmail = (email, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setEmailCopiado(email);
    setTimeout(() => setEmailCopiado(null), 2000);
  };

  const copiarTodosEmails = () => {
    let emails;
    if (modoSeleccion && idsSeleccionados.size > 0) {
      emails = datosFiltrados
        .filter(d => idsSeleccionados.has(d.id) && d.email)
        .map(d => d.email)
        .join(', ');
    } else {
      emails = datosFiltrados
        .filter(d => d.email)
        .map(d => d.email)
        .join(', ');
    }
    navigator.clipboard.writeText(emails);
    setTodosCopiados(true);
    setTimeout(() => setTodosCopiados(false), 2000);
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    if (modoBulk && idsSeleccionados.size > 0) {
      [...idsSeleccionados].forEach(sid => actualizarItem(sid, { status: nuevoEstado }));
    } else {
      actualizarItem(id, { status: nuevoEstado });
      if (itemSeleccionado) setItemSeleccionado(prev => ({ ...prev, status: nuevoEstado }));
    }
  };

  const ocultarItem = (id) => {
    if (modoSeleccion && idsSeleccionados.size > 0 && idsSeleccionados.has(id)) {
      [...idsSeleccionados].forEach(sid => actualizarItem(sid, { hidden: true }));
      setIdsSeleccionados(new Set());
      setModoSeleccion(false);
    } else {
      actualizarItem(id, { hidden: true });
    }
  };

  const toggleBarrio = (barrio) => {
    setBarriosFiltrados(prev =>
      prev.includes(barrio) ? prev.filter(b => b !== barrio) : [...prev, barrio]
    );
  };

  const toggleModoSeleccion = () => {
    if (modoSeleccion) setIdsSeleccionados(new Set());
    setModoSeleccion(!modoSeleccion);
  };

  const toggleSeleccion = (id) => {
    setIdsSeleccionados(prev => {
      const nuevo = new Set(prev);
      nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id);
      return nuevo;
    });
  };

  const seleccionarTodos = () => {
    setIdsSeleccionados(new Set(datosFiltrados.map(d => d.id)));
  };

  const limpiarSeleccion = () => setIdsSeleccionados(new Set());

  const abrirModal = (item) => {
    if (modoSeleccion && idsSeleccionados.size > 0 && idsSeleccionados.has(item.id)) {
      setModoBulk(true);
      setItemSeleccionado(item);
    } else {
      setModoBulk(false);
      setItemSeleccionado(item);
      setEditNombre(item.nombre || '');
      setEditEmail(item.email || '');
      setEditDireccion(item.direccion || '');
      setEditBarrio(item.barrio || 'Surfers Paradise');
      setEditNotas(item.notas || '');
      setEditEmailVerified(item.emailVerified ?? null);
    }
  };

  const cerrarModal = async () => {
    if (!modoBulk && itemSeleccionado) {
      const cambios = {};
      if (editNombre !== (itemSeleccionado.nombre || '')) cambios.nombre = editNombre;
      if (editEmail !== (itemSeleccionado.email || '')) {
        cambios.email = editEmail;
        cambios.emailVerified = editEmail ? false : null;
      }
      if (editEmailVerified !== (itemSeleccionado.emailVerified ?? null)) {
        cambios.emailVerified = editEmailVerified;
      }
      if (editDireccion !== (itemSeleccionado.direccion || '')) cambios.direccion = editDireccion;
      if (editBarrio !== (itemSeleccionado.barrio || '')) cambios.barrio = editBarrio;
      if (editNotas !== (itemSeleccionado.notas || '')) cambios.notas = editNotas;

      if (Object.keys(cambios).length > 0) {
        actualizarItem(itemSeleccionado.id, cambios);
      }
    }

    setItemSeleccionado(null);
    setEditNombre(''); setEditEmail(''); setEditDireccion('');
    setEditBarrio(''); setEditNotas(''); setEditEmailVerified(null);
    if (modoBulk) {
      setModoBulk(false);
      setIdsSeleccionados(new Set());
      setModoSeleccion(false);
    }
  };

  const labelSector = { bares: 'Bares', construccion: 'Construccion', fabricas: 'Fabricas', reclutadoras: 'Reclutadoras' }[sector] ?? 'Lugares';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size={48} label="Cargando empresas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectorToggle
        sector={sector}
        onSectorChange={(s) => {
          setSector(s);
          setBarriosFiltrados([]);
          setBusqueda('');
          setIdsSeleccionados(new Set());
          setModoSeleccion(false);
          setEstadoFiltrado(null);
        }}
        onAgregar={() => setMostrarModal(true)}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{labelSector} en Gold Coast</h2>
            <p className="text-dark-subtext text-sm">
              Mostrando {datosFiltrados.length} de {data.length} lugares
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 text-dark-subtext w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o barrio..."
                className="w-full bg-dark-surface border border-transparent focus:border-accent rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button
              onClick={toggleModoSeleccion}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                modoSeleccion
                  ? 'bg-purple-600 text-white hover:bg-purple-500'
                  : 'bg-dark-surface border border-dark-hover text-dark-text hover:border-accent'
              }`}
            >
              <CheckSquare size={16} />
              {modoSeleccion ? 'Cancelar' : 'Seleccionar'}
            </button>
            <button
              onClick={copiarTodosEmails}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-black rounded-full text-sm font-medium hover:bg-accent/90 transition-all duration-200 hover:scale-105 whitespace-nowrap"
            >
              {todosCopiados ? (
                <>
                  <Check size={16} className="animate-bounce" />
                  Copiado!
                </>
              ) : modoSeleccion && idsSeleccionados.size > 0 ? (
                <>
                  <Mail size={16} />
                  Copiar seleccionados ({idsSeleccionados.size})
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Copiar todos los emails
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filtro por barrio */}
        <div className="relative">
          <button
            onClick={() => setMostrarFiltroBarrio(!mostrarFiltroBarrio)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-hover rounded-full text-sm font-medium hover:border-accent transition-all duration-200"
          >
            <Filter size={16} className={`transition-transform duration-200 ${mostrarFiltroBarrio ? 'rotate-180' : ''}`} />
            Filtrar por barrio
            {barriosFiltrados.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-accent text-black rounded-full text-xs">
                {barriosFiltrados.length}
              </span>
            )}
          </button>

          {mostrarFiltroBarrio && (
            <div className="mt-2 p-3 bg-dark-sidebar border border-dark-hover rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap gap-2">
                {barriosUnicos.map((barrio) => (
                  <button
                    key={barrio}
                    onClick={() => toggleBarrio(barrio)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      barriosFiltrados.includes(barrio)
                        ? 'bg-accent text-black'
                        : 'bg-dark-surface text-dark-text hover:bg-dark-hover'
                    }`}
                  >
                    {barrio}
                  </button>
                ))}
              </div>
              {barriosFiltrados.length > 0 && (
                <button
                  onClick={() => setBarriosFiltrados([])}
                  className="mt-3 text-xs text-dark-subtext hover:text-accent transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barra de seleccion */}
      {modoSeleccion && (
        <div className="flex items-center justify-between bg-purple-900/30 border border-purple-500/30 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckSquare size={18} className="text-purple-400" />
            <span className="text-sm">
              <span className="font-semibold text-purple-300">{idsSeleccionados.size}</span>
              <span className="text-dark-subtext"> de {datosFiltrados.length} seleccionados</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={seleccionarTodos}
              className="text-xs px-3 py-1.5 bg-purple-600/50 hover:bg-purple-600 text-white rounded-full transition-colors"
            >
              Seleccionar todos
            </button>
            {idsSeleccionados.size > 0 && (
              <button
                onClick={limpiarSeleccion}
                className="text-xs px-3 py-1.5 bg-dark-surface hover:bg-dark-hover text-dark-text rounded-full transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-dark-sidebar rounded-2xl overflow-hidden border border-dark-hover shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-surface text-dark-subtext text-xs uppercase tracking-wider border-b border-dark-hover">
                {modoSeleccion && (
                  <th className="p-4 w-12">
                    <button
                      onClick={idsSeleccionados.size === datosFiltrados.length ? limpiarSeleccion : seleccionarTodos}
                      className="p-1 hover:bg-dark-hover rounded transition-colors"
                    >
                      {idsSeleccionados.size === datosFiltrados.length
                        ? <CheckSquare size={18} className="text-accent" />
                        : <Square size={18} />
                      }
                    </button>
                  </th>
                )}
                <th className="p-4">Barrio</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Email</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-hover">
              {datosFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-dark-hover/50 transition-colors group ${
                    modoSeleccion && idsSeleccionados.has(item.id) ? 'bg-accent/10' : ''
                  }`}
                  onClick={modoSeleccion ? () => toggleSeleccion(item.id) : undefined}
                  style={modoSeleccion ? { cursor: 'pointer' } : undefined}
                >
                  {modoSeleccion && (
                    <td className="p-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSeleccion(item.id); }}
                        className="p-1 hover:bg-dark-surface rounded transition-colors"
                      >
                        {idsSeleccionados.has(item.id)
                          ? <CheckSquare size={18} className="text-accent" />
                          : <Square size={18} className="text-dark-subtext" />
                        }
                      </button>
                    </td>
                  )}
                  <td className="p-4 text-dark-subtext text-sm">{item.barrio}</td>
                  <td className="p-4 font-medium">{item.nombre}</td>
                  <td className="p-4">
                    {item.email ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => copiarEmail(item.email, e)}
                          className="text-dark-subtext hover:text-accent text-sm font-mono transition-all duration-200 hover:underline decoration-accent decoration-2 underline-offset-2 cursor-pointer relative"
                          title="Clic para copiar"
                        >
                          {item.email}
                          {emailCopiado === item.email && (
                            <span className="absolute -right-16 top-0 flex items-center gap-1 text-green-400 text-xs font-sans animate-in fade-in slide-in-from-left-2">
                              <Check size={12} className="animate-bounce" />
                              Copiado!
                            </span>
                          )}
                        </button>
                        {item.emailVerified === true && (
                          <ShieldCheck size={14} className="text-green-400 flex-shrink-0" title="Email verificado" />
                        )}
                        {item.emailVerified === false && (
                          <ShieldAlert size={14} className="text-amber-400 flex-shrink-0" title="Email sin verificar" />
                        )}
                      </div>
                    ) : (
                      <span className="text-dark-subtext text-sm italic">Sin email</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${STATUS_OPTIONS.find(s => s.label === item.status)?.color}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirModal(item); }}
                        className="p-2 rounded-full hover:bg-dark-surface text-accent transition-all duration-200 hover:rotate-12 hover:scale-110"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); ocultarItem(item.id); }}
                        className="p-2 rounded-full hover:bg-dark-surface text-dark-subtext hover:text-red-400 transition-all duration-200 hover:scale-110"
                        title="Ocultar"
                      >
                        <EyeOff size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leyenda de estados */}
        <div className="px-4 py-3 border-t border-dark-hover bg-dark-bg/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setEstadoFiltrado(estadoFiltrado === s.label ? null : s.label)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all ${
                    estadoFiltrado === s.label
                      ? `${s.color} text-white`
                      : 'text-dark-subtext hover:text-dark-text hover:bg-dark-hover'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${estadoFiltrado === s.label ? 'bg-white' : s.color}`} />
                  <span>{conteoEstados[s.label] || 0} {s.label.toLowerCase()}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => exportarCSV(data, sector, estadoFiltrado)}
              className="p-1.5 text-dark-subtext hover:text-accent transition-colors"
              title="Exportar CSV"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Ocultos */}
        {cantidadOcultos > 0 && (
          <div className="px-4 py-3 border-t border-dark-hover bg-dark-bg/50">
            <button
              onClick={() => setMostrarOcultos(!mostrarOcultos)}
              className="flex items-center gap-2 text-xs text-dark-subtext hover:text-accent transition-colors"
            >
              {mostrarOcultos ? (
                <>
                  <EyeOff size={14} />
                  Ocultar entradas ({cantidadOcultos})
                </>
              ) : (
                <>
                  <Eye size={14} />
                  Mostrar entradas ocultas ({cantidadOcultos})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de edicion */}
      {itemSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-sidebar w-full max-w-md rounded-2xl border border-dark-hover shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-dark-hover sticky top-0 bg-dark-sidebar">
              <h3 className="text-xl font-bold">
                {modoBulk && itemsSeleccionados.length > 0 ? (
                  <span className="flex items-center gap-2">
                    <CheckSquare size={20} className="text-purple-400" />
                    Editando {itemsSeleccionados.length} items
                  </span>
                ) : (
                  'Editar empresa'
                )}
              </h3>
              <button onClick={cerrarModal} className="p-1 hover:bg-dark-surface rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modoBulk && itemsSeleccionados.length > 0 ? (
                <>
                  <div className="max-h-20 overflow-y-auto mb-4">
                    <div className="flex flex-wrap gap-1">
                      {itemsSeleccionados.map((it) => (
                        <span key={it.id} className="text-dark-subtext text-xs bg-dark-surface px-2 py-1 rounded-full">
                          {it.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-subtext mb-2 uppercase">
                      Cambiar estado a todos ({itemsSeleccionados.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((s) => {
                        const activo = itemsSeleccionados.every(it => it.status === s.label);
                        return (
                          <button
                            key={s.label}
                            onClick={() => cambiarEstado(itemSeleccionado.id, s.label)}
                            className={`p-2 rounded-lg text-sm border transition-all ${
                              activo
                                ? `${s.color} border-transparent text-white`
                                : 'border-dark-hover bg-dark-surface hover:border-dark-subtext'
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-dark-subtext mb-1.5">Nombre</label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-subtext mb-1.5">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => {
                        setEditEmail(e.target.value);
                        if (e.target.value) setEditEmailVerified(false);
                        else setEditEmailVerified(null);
                      }}
                      placeholder="contact@example.com.au"
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  {editEmail && (
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-xl border transition-colors"
                      style={{
                        borderColor: editEmailVerified ? '#22c55e44' : '#f59e0b44',
                        background: editEmailVerified ? '#22c55e11' : '#f59e0b11',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {editEmailVerified
                          ? <ShieldCheck size={16} className="text-green-400" />
                          : <ShieldAlert size={16} className="text-amber-400" />
                        }
                        <span className="text-sm font-medium" style={{ color: editEmailVerified ? '#4ade80' : '#fbbf24' }}>
                          {editEmailVerified ? 'Email verificado' : 'Email sin verificar'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditEmailVerified(prev => !prev)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                          editEmailVerified
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        }`}
                      >
                        {editEmailVerified ? 'Marcar sin verificar' : 'Confirmar email'}
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-dark-subtext mb-1.5">Direccion</label>
                    <input
                      type="text"
                      value={editDireccion}
                      onChange={(e) => setEditDireccion(e.target.value)}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-subtext mb-1.5">Barrio</label>
                    <select
                      value={editBarrio}
                      onChange={(e) => setEditBarrio(e.target.value)}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors"
                    >
                      {BARRIOS_GC.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-subtext mb-1.5">Estado</label>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.label}
                          onClick={() => cambiarEstado(itemSeleccionado.id, s.label)}
                          className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                            itemSeleccionado.status === s.label
                              ? `${s.color} border-transparent text-white`
                              : 'border-dark-hover bg-dark-surface hover:border-dark-subtext'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-subtext mb-1.5">Notas</label>
                    <textarea
                      value={editNotas}
                      onChange={(e) => setEditNotas(e.target.value)}
                      placeholder="Respondieron? Que dijeron?"
                      rows={3}
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-dark-hover">
              <button
                onClick={cerrarModal}
                className="px-4 py-2 bg-accent text-black font-semibold rounded-full hover:bg-accent/90 transition-colors"
              >
                Guardar y cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateCompanyModal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        sector={sector}
        onCreate={crearItem}
      />
    </div>
  );
};

export default TrackerView;
