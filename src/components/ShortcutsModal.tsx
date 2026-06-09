import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = [
    {
      title: 'Selección y Edición',
      items: [
        { keys: ['Ctrl', 'C'], desc: 'Copiar elemento(s) seleccionado(s)' },
        { keys: ['Ctrl', 'V'], desc: 'Pegar elemento(s) copiado(s)' },
        { keys: ['Ctrl', 'D'], desc: 'Duplicar elemento(s) (bloquea favorito navegador)' },
        { keys: ['Supr'], desc: 'Eliminar elemento(s) seleccionado(s)' },
        { keys: ['Retroceso'], desc: 'Eliminar elemento(s) seleccionado(s)' },
        { keys: ['R'], desc: 'Renombrar elemento seleccionado' },
        { keys: ['Esc'], desc: 'Deseleccionar todo o cancelar acción' },
        { keys: ['Click Derecho'], desc: 'Abrir opciones de elemento/lienzo' },
      ],
    },
    {
      title: 'Movimiento y Ajustes',
      items: [
        { keys: ['↑', '↓', '←', '→'], desc: 'Mover objeto seleccionado por 1 cm' },
        { keys: ['Shift', '↑', '↓', '←', '→'], desc: 'Mover objeto seleccionado por 10 cm' },
        { keys: ['Shift', 'Rotar thumb'], desc: 'Rotar en incrementos exactos de 15°' },
      ],
    },
    {
      title: 'Navegación y Historial',
      items: [
        { keys: ['Ctrl', 'Z'], desc: 'Deshacer última acción (Undo)' },
        { keys: ['Ctrl', 'Y'], desc: 'Rehacer última acción (Redo)' },
        { keys: ['Espacio', 'Arrastrar'], desc: 'Desplazar (Pan) el lienzo libremente' },
        { keys: ['Rueda Ratón'], desc: 'Acercar o alejar el zoom del lienzo' },
        { keys: ['Ctrl', '/'], desc: 'Abrir esta guía de atajos de teclado' },
      ],
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(21, 29, 48, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 24px rgba(99, 102, 241, 0.15)',
          padding: '24px',
          width: '90%',
          maxWidth: '550px',
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={20} style={{ color: 'var(--color-primary)' }} />
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Atajos de Teclado
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {categories.map((cat, idx) => (
            <div key={idx}>
              <h4
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '0.8rem',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {cat.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{item.desc}</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd
                            style={{
                              backgroundColor: 'rgba(5, 7, 12, 0.6)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '4px',
                              padding: '2px 5px',
                              fontSize: '0.7rem',
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              boxShadow: '0 1.5px 0 rgba(0,0,0,0.5)',
                            }}
                          >
                            {k}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '5px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '12px',
          }}
        >
          Tip: Presiona <kbd style={{ padding: '1px 3px', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '3px' }}>Ctrl</kbd> + <kbd style={{ padding: '1px 3px', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '3px' }}>/</kbd> para abrir esta guía en cualquier momento.
        </div>
      </div>
    </div>
  );
};
