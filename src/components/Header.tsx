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
  Maximize
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
      <a href="/" className="logo" style={{ textDecoration: 'none', cursor: 'pointer' }}>
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

        <div className="toolbar-divider" />

        {/* Reset board */}
        <button className="btn-icon" onClick={clearCanvas} title="Limpiar Lienzo" style={{ color: 'var(--color-accent)' }}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Right: Export & Import actions */}
      <div className="toolbar-group">
        {/* Import JSON */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden-file-input"
          accept=".json"
          onChange={importJSON}
        />
        <button className="btn btn-secondary" onClick={handleImportClick} title="Cargar proyecto JSON">
          <Upload size={14} /> Importar
        </button>

        {/* Export JSON */}
        <button className="btn btn-secondary" onClick={exportJSON} title="Descargar proyecto JSON">
          <Download size={14} /> Guardar
        </button>

        {/* Export Drawing formats */}
        <button className="btn btn-secondary" onClick={exportSVG} title="Descargar plano en formato vectorial SVG">
          <ImageIcon size={14} /> Exportar SVG
        </button>
        
        <button className="btn btn-primary" onClick={exportPNG} title="Descargar plano en formato de imagen PNG">
          <ImageIcon size={14} /> Exportar PNG
        </button>
      </div>
    </header>
  );
};
