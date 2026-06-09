import React, { useRef } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  Image as ImageIcon,
  Trash2,
  Maximize,
  Keyboard,
} from 'lucide-react';

interface HeaderProps {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  setZoom: (zoom: number) => void;
  resetZoomAndPan: () => void;
  clearCanvas: () => void;
  exportJSON: () => void;
  importJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exportSVG: () => void;
  exportPNG: () => void;
  onShowShortcuts: () => void;
  onOptimizeLayout?: () => void;
  isOptimizing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  undo,
  redo,
  canUndo,
  canRedo,
  zoom,
  setZoom,
  resetZoomAndPan,
  clearCanvas,
  exportJSON,
  importJSON,
  exportSVG,
  exportPNG,
  onShowShortcuts,
  onOptimizeLayout: _onOptimizeLayout,
  isOptimizing: _isOptimizing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.15, 4));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.15, 0.4));
  const handleZoomReset = () => {
    setZoom(1);
    resetZoomAndPan();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="header-toolbar">
      {/* Brand logo */}
      <a href="index.html" className="logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
        📐 Ortho<span>s</span>
      </a>

      {/* Center: Toolbar controls */}
      <div className="toolbar-group">
        {/* Undo / Redo */}
        <button
          className="btn-icon"
          onClick={undo}
          disabled={!canUndo}
          title="Deshacer (Ctrl+Z)"
          style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
        >
          <Undo2 size={16} />
        </button>
        <button
          className="btn-icon"
          onClick={redo}
          disabled={!canRedo}
          title="Rehacer (Ctrl+Y)"
          style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
        >
          <Redo2 size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Zooming */}
        <button className="btn-icon" onClick={handleZoomOut} title="Alejar Zoom">
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '0.78rem', width: '45px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="btn-icon" onClick={handleZoomIn} title="Acercar Zoom">
          <ZoomIn size={16} />
        </button>
        <button className="btn-icon" onClick={handleZoomReset} title="Restaurar Vista">
          <Maximize size={16} />
        </button>
        <button className="btn-icon" onClick={onShowShortcuts} title="Atajos de Teclado (Ctrl+/)">
          <Keyboard size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Reset board */}
        <button className="btn-icon" onClick={clearCanvas} title="Limpiar Lienzo" style={{ color: 'var(--color-accent)' }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Right: Export & Import actions */}
      <div className="toolbar-group">
        {/* Auto-Acomodar layout optimizer button — temporarily hidden; see optimizer tab in right sidebar */}
        {/* {onOptimizeLayout && (
          <button
            className="btn-premium-optimizer-header"
            onClick={onOptimizeLayout}
            disabled={isOptimizing}
            title="Auto-acomodar la distribución de muebles en base a reglas de espacio, flujo e iluminación natural."
          >
            <Sparkles size={14} />
            <span className="btn-text">{isOptimizing ? 'Acomodando...' : 'Auto-Acomodar'}</span>
          </button>
        )} */}

        <a
          href="https://markdify.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          title="Ir a Markdify Tools"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderColor: 'rgba(99, 102, 241, 0.35)',
            color: '#818cf8',
          }}
        >
          ❖ <span className="btn-text">Markdify</span>
        </a>
        {/* Import JSON */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden-file-input"
          accept=".json"
          onChange={importJSON}
        />
        <button className="btn btn-secondary" onClick={handleImportClick} title="Importar proyecto JSON">
          <Upload size={14} /> <span className="btn-text">Importar</span>
        </button>

        {/* Export JSON */}
        <button className="btn btn-secondary" onClick={exportJSON} title="Guardar proyecto JSON">
          <Download size={14} /> <span className="btn-text">Guardar</span>
        </button>

        {/* Export Drawing formats */}
        <button className="btn btn-secondary" onClick={exportSVG} title="Exportar plano en SVG">
          <ImageIcon size={14} /> <span className="btn-text">Exportar SVG</span>
        </button>
        
        <button className="btn btn-primary" onClick={exportPNG} title="Exportar plano en PNG">
          <ImageIcon size={14} /> <span className="btn-text">Exportar PNG</span>
        </button>
      </div>
    </header>
  );
};
