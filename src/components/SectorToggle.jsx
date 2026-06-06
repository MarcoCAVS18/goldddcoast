import { Beer, HardHat, Factory, Plus } from 'lucide-react';

const SECTORES = [
  { id: 'bares', label: 'Bares', icon: Beer },
  { id: 'construccion', label: 'Construccion', icon: HardHat },
  { id: 'fabricas', label: 'Fabricas', icon: Factory },
];

const SectorToggle = ({ sector, onSectorChange, onAgregar, mostrarBotonAgregar = true }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <div className="bg-dark-sidebar p-1 rounded-full border border-dark-hover inline-flex flex-wrap">
        {SECTORES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSectorChange(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              sector === id
                ? 'bg-dark-surface text-white shadow-sm'
                : 'text-dark-subtext hover:text-white'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
        {mostrarBotonAgregar && onAgregar && (
          <button
            onClick={onAgregar}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all bg-accent text-black hover:bg-accent/90"
          >
            <Plus size={15} />
            Agregar
          </button>
        )}
      </div>
    </div>
  );
};

export default SectorToggle;
