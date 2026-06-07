const Spinner = ({ size = 40, label = 'Cargando...' }) => {
  const border = Math.max(3, size / 10);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        style={{
          width: size,
          height: size,
          border: `${border}px solid var(--color-accent, #6572ff)`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          boxSizing: 'border-box',
        }}
      />
      {label && (
        <span className="text-xs text-dark-subtext">{label}</span>
      )}
      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;
