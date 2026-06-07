import { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, CheckCheck, RefreshCw, Mail } from 'lucide-react';
import SectorToggle from './SectorToggle';
import { useSupabaseData as useLocalData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import Spinner from './Spinner';

const SECTOR_LABELS = {
  bares: 'Bares & Restaurantes',
  construccion: 'Construccion',
  fabricas: 'Fabricas',
  reclutadoras: 'Reclutadoras',
};

const EmailView = () => {
  const [sector, setSector] = useState('bares');
  const [templates, setTemplates] = useState({
    bares: '', construccion: '', fabricas: '', reclutadoras: '',
  });
  const [cargandoIA, setCargandoIA] = useState(false);
  const [copiadoTemplate, setCopiadoTemplate] = useState(false);
  const [errorIA, setErrorIA] = useState('');
  const [emailCopiado, setEmailCopiado] = useState(null);
  // ref para el debounce de guardado automatico
  const debounceRef = useRef({});

  const { data, loading } = useLocalData(sector);

  // carga todos los templates desde Supabase al montar
  useEffect(() => {
    const cargar = async () => {
      const { data: filas } = await supabase
        .from('email_templates')
        .select('sector, texto');
      if (filas) {
        const mapa = Object.fromEntries(filas.map(f => [f.sector, f.texto ?? '']));
        setTemplates(prev => ({ ...prev, ...mapa }));
      }
    };
    cargar();
  }, []);

  // guarda en Supabase con debounce de 1.5s para no saturar en cada tecla
  const guardarTemplate = (sec, texto) => {
    clearTimeout(debounceRef.current[sec]);
    debounceRef.current[sec] = setTimeout(async () => {
      await supabase
        .from('email_templates')
        .update({ texto })
        .eq('sector', sec);
    }, 1500);
  };

  const handleTextoChange = (e) => {
    const texto = e.target.value;
    setTemplates(prev => ({ ...prev, [sector]: texto }));
    guardarTemplate(sector, texto);
    if (errorIA) setErrorIA('');
  };

  const mejorarConIA = async () => {
    const texto = templates[sector]?.trim();
    if (!texto) return;

    setCargandoIA(true);
    setErrorIA('');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an assistant helping a job seeker improve their job application emails in Australia.
The output must always be in English, regardless of the input language.
Make the email more human, concise and friendly while keeping it professional.
Return ONLY the improved email text, no explanations or extra content.
The email should sound like it was written by a real person, not a corporation.`,
            },
            {
              role: 'user',
              content: `Improve this job application email for the ${SECTOR_LABELS[sector]} industry. Output in English only:\n\n${texto}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Error ${response.status}`);
      }

      const result = await response.json();
      const mejorado = result.choices?.[0]?.message?.content?.trim();
      if (mejorado) {
        setTemplates(prev => ({ ...prev, [sector]: mejorado }));
        guardarTemplate(sector, mejorado);
      }
    } catch (err) {
      setErrorIA(`Error al conectar con la IA: ${err.message}`);
    } finally {
      setCargandoIA(false);
    }
  };

  const copiarTemplate = async () => {
    if (!templates[sector]) return;
    try {
      await navigator.clipboard.writeText(templates[sector]);
      setCopiadoTemplate(true);
      setTimeout(() => setCopiadoTemplate(false), 2000);
    } catch {
      // clipboard no disponible
    }
  };

  const copiarEmail = async (email, id) => {
    try {
      await navigator.clipboard.writeText(email);
      setEmailCopiado(id);
      setTimeout(() => setEmailCopiado(null), 2000);
    } catch {
      // clipboard no disponible
    }
  };

  const empresasVisibles = data.filter(e => !e.hidden);
  const conEmail = empresasVisibles.filter(e => e.email);
  const sinEmail = empresasVisibles.filter(e => !e.email);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size={40} label="Cargando empresas..." />
        </div>
      )}
      {/* Encabezado */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail size={18} className="text-accent" />
            Compositor de Emails
          </h2>
          <p className="text-sm text-dark-subtext">
            Escribi el cuerpo de tu email por categoria. La IA puede mejorar el texto por vos.
          </p>
        </div>

        <SectorToggle
          sector={sector}
          onSectorChange={(s) => {
            setSector(s);
            setErrorIA('');
          }}
          mostrarBotonAgregar={false}
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Panel izquierdo: editor */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-sm font-medium text-dark-subtext">
              Template — {SECTOR_LABELS[sector]}
            </label>
            <div className="flex gap-2">
              <button
                onClick={copiarTemplate}
                disabled={!templates[sector]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-dark-hover hover:bg-dark-surface text-dark-subtext hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copiadoTemplate ? <CheckCheck size={13} /> : <Copy size={13} />}
                {copiadoTemplate ? 'Copiado' : 'Copiar todo'}
              </button>
              <button
                onClick={mejorarConIA}
                disabled={!templates[sector]?.trim() || cargandoIA}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-black hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cargandoIA
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <Sparkles size={13} />
                }
                {cargandoIA ? 'Mejorando...' : 'Mejorar con IA'}
              </button>
            </div>
          </div>

          <textarea
            value={templates[sector] || ''}
            onChange={handleTextoChange}
            placeholder={`Escribi tu email para ${SECTOR_LABELS[sector]}...\n\nEj: Hola, mi nombre es Marco y estoy buscando trabajo en el area de...`}
            rows={18}
            className="w-full bg-dark-surface border border-dark-hover rounded-xl p-4 text-sm text-dark-text placeholder-dark-subtext/40 resize-y focus:outline-none focus:border-accent/50 transition-colors leading-relaxed"
          />

          {errorIA && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">
              {errorIA}
            </p>
          )}

          <p className="text-xs text-dark-subtext">
            {(templates[sector] || '').length} caracteres &middot; Se guarda automaticamente
          </p>
        </div>

        {/* Panel derecho: lista de empresas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-dark-subtext">
              Empresas de {SECTOR_LABELS[sector]}
            </span>
            <div className="flex gap-2 text-xs text-dark-subtext">
              <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full">
                {conEmail.length} con email
              </span>
              <span className="bg-dark-hover px-2 py-1 rounded-full">
                {sinEmail.length} sin email
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
            {empresasVisibles.length === 0 && (
              <div className="text-sm text-dark-subtext text-center py-8 bg-dark-surface rounded-xl border border-dark-hover">
                No hay empresas en este sector
              </div>
            )}

            {/* Con email */}
            {conEmail.map(empresa => (
              <div
                key={empresa.id}
                className="flex items-center justify-between bg-dark-surface border border-dark-hover rounded-xl px-4 py-3 gap-3 hover:border-accent/30 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium truncate">{empresa.nombre}</span>
                  <span className="text-xs text-accent truncate">{empresa.email}</span>
                  {empresa.status !== 'Pendiente' && (
                    <span className="text-[10px] text-dark-subtext">{empresa.status}</span>
                  )}
                </div>
                <button
                  onClick={() => copiarEmail(empresa.email, empresa.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-dark-hover text-dark-subtext hover:text-white transition-all"
                  title="Copiar email"
                >
                  {emailCopiado === empresa.id
                    ? <CheckCheck size={13} className="text-green-400" />
                    : <Copy size={13} />
                  }
                </button>
              </div>
            ))}

            {/* Sin email */}
            {sinEmail.length > 0 && (
              <>
                <div className="text-xs text-dark-subtext px-1 pt-2 pb-1">Sin email registrado</div>
                {sinEmail.map(empresa => (
                  <div
                    key={empresa.id}
                    className="flex items-center bg-dark-surface/40 border border-dark-hover/40 rounded-xl px-4 py-3 opacity-50"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">{empresa.nombre}</span>
                      <span className="text-xs text-dark-subtext">sin email &mdash; {empresa.barrio}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailView;
