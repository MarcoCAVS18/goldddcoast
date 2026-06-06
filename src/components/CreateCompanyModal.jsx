import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { STATUS_OPTIONS } from '../constants/statusOptions';

const BARRIOS_GC = [
  'Surfers Paradise', 'Broadbeach', 'Burleigh Heads', 'Mermaid Beach',
  'Miami', 'Palm Beach', 'Currumbin', 'Southport', 'Main Beach',
  'Hope Island', 'Coolangatta', 'Robina', 'Bundall', 'Helensvale',
  'Coomera', 'Yatala', 'Currumbin Waters', 'Varsity Lakes', 'Kirra',
];

const CreateCompanyModal = ({ isOpen, onClose, sector, onCreate }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    direccion: '',
    barrio: 'Surfers Paradise',
    notas: '',
    status: 'Pendiente',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCreate({
        nombre: formData.nombre.trim(),
        email: formData.email.trim(),
        direccion: formData.direccion.trim(),
        barrio: formData.barrio,
        notas: formData.notas.trim(),
        status: formData.status,
      });

      setFormData({ nombre: '', email: '', direccion: '', barrio: 'Surfers Paradise', notas: '', status: 'Pendiente' });
      onClose();
    } catch {
      setError('Error al crear. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ nombre: '', email: '', direccion: '', barrio: 'Surfers Paradise', notas: '', status: 'Pendiente' });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const labelSector = sector === 'bares' ? 'Bar' : sector === 'construccion' ? 'Empresa de Construccion' : 'Fabrica';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-sidebar w-full max-w-md rounded-2xl border border-dark-hover shadow-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-6 border-b border-dark-hover sticky top-0 bg-dark-sidebar">
            <h3 className="text-xl font-bold">Agregar {labelSector}</h3>
            <button type="button" onClick={handleClose} className="p-1 hover:bg-dark-surface rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-subtext mb-1.5">Nombre <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Nombre del lugar..."
                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-subtext mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@example.com.au"
                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-subtext mb-1.5">Direccion</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="123 Gold Coast Hwy, Suburb QLD"
                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-subtext mb-1.5">Barrio</label>
              <select
                value={formData.barrio}
                onChange={(e) => handleChange('barrio', e.target.value)}
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
                    type="button"
                    onClick={() => handleChange('status', s.label)}
                    className={`p-2 rounded-lg text-xs font-medium border transition-all ${
                      formData.status === s.label
                        ? `${s.color} border-transparent text-white`
                        : 'border-dark-hover bg-dark-surface hover:border-dark-subtext text-dark-text'
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
                value={formData.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                placeholder="Informacion adicional..."
                rows={3}
                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-hover rounded-xl text-sm outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-dark-hover">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-dark-surface text-dark-text font-medium rounded-full hover:bg-dark-hover transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent text-black font-semibold rounded-full hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompanyModal;
