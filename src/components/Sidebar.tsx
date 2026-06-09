import React from 'react';
import type {
  RoomObject,
  RoomSettings,
  ObjectType,
  Unit,
  GridSettings,
  Point
} from '../types';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  roomSettings: RoomSettings;
  setRoomSettings: (settings: RoomSettings) => void;
  objects: RoomObject[];
  addObject: (type: ObjectType) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateObject: (id: string, updates: Partial<RoomObject>) => void;
  deleteObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  gridSettings: GridSettings;
  setGridSettings: (settings: GridSettings) => void;
  isOpen: boolean;
}

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#38bdf8', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#a1a1aa', // Zinc (Muted gray)
];

const PREDEFINED_TEMPLATES: { type: ObjectType; name: string; w: number; h: number; color: string }[] = [
  { type: 'bed', name: 'Cama Individual', w: 90, h: 190, color: '#6366f1' },
  { type: 'bed', name: 'Cama Matrimonial', w: 140, h: 190, color: '#6366f1' },
  { type: 'bed', name: 'Cama Queen', w: 160, h: 200, color: '#6366f1' },
  { type: 'bed', name: 'Cama King', w: 200, h: 200, color: '#6366f1' },
  { type: 'nightstand', name: 'Buró / Mesita', w: 50, h: 45, color: '#38bdf8' },
  { type: 'dresser', name: 'Tocador', w: 120, h: 50, color: '#38bdf8' },
  { type: 'wardrobe', name: 'Ropero / Clóset', w: 150, h: 60, color: '#8b5cf6' },
  { type: 'sofa', name: 'Sofá Común', w: 180, h: 90, color: '#10b981' },
  { type: 'table', name: 'Escritorio / Mesa', w: 120, h: 75, color: '#f59e0b' },
  { type: 'chair', name: 'Silla', w: 45, h: 45, color: '#f59e0b' },
  { type: 'stairs', name: 'Escaleras', w: 80, h: 200, color: '#a1a1aa' },
  { type: 'door', name: 'Puerta', w: 80, h: 8, color: '#ef4444' },
  { type: 'window', name: 'Ventana', w: 120, h: 15, color: '#ec4899' },
  { type: 'box', name: 'Caja de Mudanza', w: 50, h: 50, color: '#a1a1aa' },
  { type: 'text', name: 'Nota de Texto', w: 100, h: 40, color: '#a1a1aa' },
];

export const LeftSidebar: React.FC<Pick<SidebarProps, 'roomSettings' | 'setRoomSettings' | 'addObject' | 'unit' | 'setUnit' | 'isOpen'>> = ({
  roomSettings,
  setRoomSettings,
  addObject,
  unit,
  setUnit,
  isOpen,
}) => {
  const vertices = roomSettings.vertices && roomSettings.vertices.length >= 3
    ? roomSettings.vertices
    : [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 350 },
        { x: 0, y: 350 }
      ];

  const [localWallLengths, setLocalWallLengths] = React.useState<string[]>([]);

  // Unit conversion helpers
  const toUnitValue = (cmVal: number) => {
    switch (unit) {
      case 'm': return parseFloat((cmVal / 100).toFixed(2));
      case 'in': return Math.round(cmVal / 2.54);
      case 'ft': return parseFloat((cmVal / 30.48).toFixed(2));
      case 'cm':
      default: return Math.round(cmVal);
    }
  };

  const fromUnitValue = (val: number) => {
    switch (unit) {
      case 'm': return val * 100;
      case 'in': return val * 2.54;
      case 'ft': return val * 30.48;
      case 'cm':
      default: return val;
    }
  };

  // Sync local wall lengths state when vertices or unit changes
  React.useEffect(() => {
    const lengths = vertices.map((v, i) => {
      const nextV = vertices[(i + 1) % vertices.length];
      const len = Math.sqrt(Math.pow(nextV.x - v.x, 2) + Math.pow(nextV.y - v.y, 2));
      return toUnitValue(len).toString();
    });
    setLocalWallLengths(lengths);
  }, [roomSettings.vertices, unit]);

  const handleLocalWallLengthChange = (idx: number, val: string) => {
    setLocalWallLengths((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // Wall displacement math when user changes a wall length manually
  const handleWallLengthChange = (index: number, valStr: string) => {
    const numericVal = parseFloat(valStr) || 0;
    if (numericVal <= 0) return;
    const newLenCm = fromUnitValue(numericVal);

    const nextIdx = (index + 1) % vertices.length;
    const p1 = vertices[index];
    const p2 = vertices[nextIdx];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const currentLen = Math.sqrt(dx * dx + dy * dy);
    if (currentLen === 0) return;

    const ratio = newLenCm / currentLen;

    if (nextIdx !== 0) {
      const newP2X = p1.x + dx * ratio;
      const newP2Y = p1.y + dy * ratio;
      const diffX = newP2X - p2.x;
      const diffY = newP2Y - p2.y;

      const newVertices = vertices.map((v, idx) => {
        if (idx >= nextIdx) {
          return { x: v.x + diffX, y: v.y + diffY };
        }
        return v;
      });
      setRoomSettings({ ...roomSettings, vertices: newVertices });
    } else {
      const dxLast = p1.x - p2.x;
      const dyLast = p1.y - p2.y;
      const lenLast = Math.sqrt(dxLast * dxLast + dyLast * dyLast);
      if (lenLast === 0) return;

      const ratioLast = newLenCm / lenLast;
      const newVertices = vertices.map((v, idx) => {
        if (idx === index) {
          return { x: p2.x + dxLast * ratioLast, y: p2.y + dyLast * ratioLast };
        }
        return v;
      });
      setRoomSettings({ ...roomSettings, vertices: newVertices });
    }
  };

  const applyWallLength = (idx: number) => {
    const typedVal = parseFloat(localWallLengths[idx]);
    if (!isNaN(typedVal) && typedVal > 0) {
      handleWallLengthChange(idx, typedVal.toString());
    } else {
      // Reset to actual
      const v = vertices[idx];
      const nextV = vertices[(idx + 1) % vertices.length];
      const len = Math.sqrt(Math.pow(nextV.x - v.x, 2) + Math.pow(nextV.y - v.y, 2));
      handleLocalWallLengthChange(idx, toUnitValue(len).toString());
    }
  };

  const handleWallLengthBlur = (idx: number) => {
    applyWallLength(idx);
  };

  const isWallLengthDifferent = (idx: number) => {
    const v = vertices[idx];
    const nextV = vertices[(idx + 1) % vertices.length];
    const actualLen = Math.sqrt(Math.pow(nextV.x - v.x, 2) + Math.pow(nextV.y - v.y, 2));
    const actualConverted = toUnitValue(actualLen);
    
    const typedVal = parseFloat(localWallLengths[idx]);
    return !isNaN(typedVal) && typedVal !== actualConverted;
  };

  // Presets
  const applyPreset = (type: 'rect' | 'l-shape' | 'asymmetric') => {
    let newVertices: Point[] = [];
    switch (type) {
      case 'rect':
        newVertices = [
          { x: 0, y: 0 },
          { x: 400, y: 0 },
          { x: 400, y: 350 },
          { x: 0, y: 350 }
        ];
        break;
      case 'l-shape':
        newVertices = [
          { x: 0, y: 0 },
          { x: 400, y: 0 },
          { x: 400, y: 200 },
          { x: 200, y: 200 },
          { x: 200, y: 350 },
          { x: 0, y: 350 }
        ];
        break;
      case 'asymmetric':
        newVertices = [
          { x: 50, y: 0 },
          { x: 350, y: 0 },
          { x: 400, y: 350 },
          { x: 0, y: 320 }
        ];
        break;
    }
    setRoomSettings({ ...roomSettings, vertices: newVertices });
  };

  return (
    <aside id="left-sidebar" className={`sidebar ${isOpen ? '' : 'collapsed'}`} aria-hidden={!isOpen}>
      <div className="sidebar-header">
        <h2>📐 Configuración</h2>
      </div>

      <div className="sidebar-scroll">
        {/* Room Boundaries section */}
        <div className="sidebar-section">
          <div className="section-title">Forma del Cuarto</div>
          
          <div className="form-group">
            <label>Preajustes de Diseño</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 2px', fontSize: '0.75rem' }} onClick={() => applyPreset('rect')}>
                Rectángulo
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px 2px', fontSize: '0.75rem' }} onClick={() => applyPreset('l-shape')}>
                Forma en L
              </button>
              <button className="btn btn-secondary" style={{ padding: '6px 2px', fontSize: '0.75rem' }} onClick={() => applyPreset('asymmetric')}>
                Asimétrico
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Unidad de Medida</label>
            <div className="input-row">
              {(['cm', 'm', 'in', 'ft'] as Unit[]).map((u) => (
                <button
                  key={u}
                  className={`btn btn-secondary btn-icon ${unit === u ? 'active' : ''}`}
                  style={{ flex: 1, padding: '6px 0', fontSize: '0.78rem' }}
                  onClick={() => setUnit(u)}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ gap: '10px' }}>
            <label>Largo de Paredes</label>
            {vertices.map((_, i) => {
              return (
                <div key={`wall-input-${i}`} className="input-row" style={{ alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: '55px', fontWeight: 600 }}>
                    Pared {i + 1}:
                  </span>
                  <div className="input-with-unit" style={{ flex: 1 }}>
                    <input
                      type="number"
                      className="form-input"
                      value={localWallLengths[i] || ''}
                      onChange={(e) => handleLocalWallLengthChange(i, e.target.value)}
                      onBlur={() => handleWallLengthBlur(i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applyWallLength(i);
                        }
                      }}
                    />
                    <span className="input-unit">{unit}</span>
                  </div>
                  {isWallLengthDifferent(i) && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}
                      onClick={() => applyWallLength(i)}
                      title="Aplicar nueva medida a esta pared"
                    >
                      Ajustar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Object Predefined Library */}
        <div className="sidebar-section">
          <div className="section-title">Librería de Objetos</div>
          <div className="library-grid">
            {PREDEFINED_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.name}
                className="library-item"
                onClick={() => addObject(tmpl.type)}
                title={`Agregar ${tmpl.name} al lienzo`}
              >
                <div className="library-item-icon" style={{ borderColor: tmpl.color, color: tmpl.color }}>
                  <Plus size={16} />
                </div>
                <div className="library-item-name">{tmpl.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export const RightSidebar: React.FC<Omit<SidebarProps, 'addObject' | 'setRoomSettings'>> = ({
  roomSettings,
  objects,
  selectedId,
  setSelectedId,
  updateObject,
  deleteObject,
  duplicateObject,
  unit,
  gridSettings,
  setGridSettings,
  isOpen,
}) => {
  const selectedObj = objects.find((o) => o.id === selectedId);

  // Unit conversion helpers
  const toUnitValue = (cmVal: number) => {
    switch (unit) {
      case 'm': return parseFloat((cmVal / 100).toFixed(2));
      case 'in': return Math.round(cmVal / 2.54);
      case 'ft': return parseFloat((cmVal / 30.48).toFixed(2));
      case 'cm':
      default: return Math.round(cmVal);
    }
  };

  const fromUnitValue = (val: number) => {
    switch (unit) {
      case 'm': return val * 100;
      case 'in': return val * 2.54;
      case 'ft': return val * 30.48;
      case 'cm':
      default: return val;
    }
  };

  const [localWidth, setLocalWidth] = React.useState('');
  const [localHeight, setLocalHeight] = React.useState('');
  const [localRotation, setLocalRotation] = React.useState('');

  // Sync local states with selected object values
  React.useEffect(() => {
    if (selectedObj) {
      setLocalWidth(toUnitValue(selectedObj.width).toString());
      setLocalHeight(toUnitValue(selectedObj.height).toString());
      setLocalRotation(selectedObj.rotation.toString());
    } else {
      setLocalWidth('');
      setLocalHeight('');
      setLocalRotation('');
    }
  }, [selectedId, selectedObj?.width, selectedObj?.height, selectedObj?.rotation, unit]);

  const handlePropChange = (key: keyof RoomObject, value: any) => {
    if (!selectedId) return;
    updateObject(selectedId, { [key]: value });
  };

  const handleWidthChange = (valStr: string) => {
    setLocalWidth(valStr);
    if (!selectedId || !selectedObj) return;
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      const cmValue = fromUnitValue(val);
      updateObject(selectedId, { width: Math.round(cmValue) });
    }
  };

  const handleWidthBlur = () => {
    if (!selectedId || !selectedObj) return;
    const val = parseFloat(localWidth);
    if (isNaN(val) || val <= 0) {
      // Reset to current width
      setLocalWidth(toUnitValue(selectedObj.width).toString());
      return;
    }
    const cmValue = fromUnitValue(val);
    
    // Boundary clamp: object cannot exceed room size
    const vertices = roomSettings.vertices || [];
    const minX = vertices.length > 0 ? Math.min(...vertices.map(v => v.x)) : 0;
    const maxX = vertices.length > 0 ? Math.max(...vertices.map(v => v.x)) : 400;
    const limit = maxX - minX;
    
    const finalVal = Math.min(limit, Math.max(5, Math.round(cmValue)));
    updateObject(selectedId, { width: finalVal });
    setLocalWidth(toUnitValue(finalVal).toString());
  };

  const handleHeightChange = (valStr: string) => {
    setLocalHeight(valStr);
    if (!selectedId || !selectedObj) return;
    const val = parseFloat(valStr);
    if (!isNaN(val) && val > 0) {
      const cmValue = fromUnitValue(val);
      updateObject(selectedId, { height: Math.round(cmValue) });
    }
  };

  const handleHeightBlur = () => {
    if (!selectedId || !selectedObj) return;
    const val = parseFloat(localHeight);
    if (isNaN(val) || val <= 0) {
      setLocalHeight(toUnitValue(selectedObj.height).toString());
      return;
    }
    const cmValue = fromUnitValue(val);
    
    // Boundary clamp: object cannot exceed room size
    const vertices = roomSettings.vertices || [];
    const minY = vertices.length > 0 ? Math.min(...vertices.map(v => v.y)) : 0;
    const maxY = vertices.length > 0 ? Math.max(...vertices.map(v => v.y)) : 350;
    const limit = maxY - minY;
    
    const finalVal = Math.min(limit, Math.max(5, Math.round(cmValue)));
    updateObject(selectedId, { height: finalVal });
    setLocalHeight(toUnitValue(finalVal).toString());
  };

  const handleRotationChange = (valStr: string) => {
    setLocalRotation(valStr);
    if (!selectedId || !selectedObj) return;
    const val = parseInt(valStr);
    if (!isNaN(val)) {
      updateObject(selectedId, { rotation: val % 360 });
    }
  };

  const handleRotationBlur = () => {
    if (!selectedId || !selectedObj) return;
    const val = parseInt(localRotation);
    if (isNaN(val)) {
      setLocalRotation(selectedObj.rotation.toString());
      return;
    }
    const finalVal = (val % 360 + 360) % 360;
    updateObject(selectedId, { rotation: finalVal });
    setLocalRotation(finalVal.toString());
  };

  // Move layers (adjust z-index)
  const adjustZIndex = (direction: 'up' | 'down') => {
    if (!selectedId || !selectedObj) return;
    const currentZ = selectedObj.zIndex;
    const delta = direction === 'up' ? 1 : -1;
    handlePropChange('zIndex', Math.max(0, currentZ + delta));
  };

  return (
    <aside id="right-sidebar" className={`sidebar right-sidebar ${isOpen ? '' : 'collapsed'}`} aria-hidden={!isOpen}>
      <div className="sidebar-header">
        <h2>🛠️ Inspector</h2>
      </div>

      <div className="sidebar-scroll">
        {selectedObj ? (
          /* PROPERTIES PANEL */
          <div className="sidebar-section">
            <div className="section-title">Propiedades del Elemento</div>
            
            {/* Edit Label Name */}
            <div className="form-group">
              <label>Nombre del Elemento</label>
              <input
                type="text"
                className="form-input"
                value={selectedObj.name}
                onChange={(e) => handlePropChange('name', e.target.value)}
              />
            </div>

            {/* Custom text label - only for text notes */}
            {selectedObj.type === 'text' && (
              <div className="form-group">
                <label>Contenido del Texto</label>
                <textarea
                  className="form-textarea"
                  value={selectedObj.text || ''}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                />
              </div>
            )}

            {/* Width and Depth */}
            <div className="form-group">
              <label>Ancho (Horizontal)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  className="form-input"
                  value={localWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  onBlur={handleWidthBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleWidthBlur();
                    }
                  }}
                />
                <span className="input-unit">{unit}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Largo / Profundidad (Vertical)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  className="form-input"
                  value={localHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  onBlur={handleHeightBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleHeightBlur();
                    }
                  }}
                />
                <span className="input-unit">{unit}</span>
              </div>
            </div>

            {/* Rotation Angle */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Rotación</label>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-secondary)', fontWeight: 600 }}>
                  {selectedObj.rotation}°
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="359"
                  value={selectedObj.rotation}
                  style={{ flex: 1 }}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handlePropChange('rotation', val);
                    setLocalRotation(val.toString());
                  }}
                />
                <input
                  type="number"
                  className="form-input"
                  value={localRotation}
                  style={{ width: '70px', padding: '8px' }}
                  onChange={(e) => handleRotationChange(e.target.value)}
                  onBlur={handleRotationBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRotationBlur();
                    }
                  }}
                />
              </div>
            </div>

            {/* Layer Ordering (zIndex) */}
            <div className="form-group">
              <label>Orden de Capas (Z-Index: {selectedObj.zIndex})</label>
              <div className="btn-group-2">
                <button className="btn btn-secondary" onClick={() => adjustZIndex('up')} title="Traer al frente">
                  <ChevronUp size={16} /> Subir
                </button>
                <button className="btn btn-secondary" onClick={() => adjustZIndex('down')} title="Enviar al fondo">
                  <ChevronDown size={16} /> Bajar
                </button>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="form-group">
              <label>Color en Plano</label>
              <div className="color-picker">
                {COLOR_PALETTE.map((c) => (
                  <div
                    key={c}
                    className={`color-option ${selectedObj.color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => handlePropChange('color', c)}
                  />
                ))}
              </div>
            </div>

            {/* Actions: Duplicate / Delete */}
            <div className="form-group" style={{ marginTop: '10px', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => selectedId && duplicateObject(selectedId)}>
              <Copy size={16} /> Duplicar Elemento
            </button>
            <button
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={() => {
                if (selectedId) {
                  deleteObject(selectedId);
                  setSelectedId(null);
                }
              }}
            >
              <Trash2 size={16} /> Eliminar Elemento
            </button>
            </div>
          </div>
        ) : (
          /* NO OBJECT SELECTED DEFAULT SIDEBAR PANELS */
          <>
            {/* Grid and Snapping Settings */}
            <div className="sidebar-section">
              <div className="section-title">Rejilla y Ajustes</div>
              <div className="form-group">
                <label className="switch-label">
                  <span>Mostrar Rejilla</span>
                  <div className="switch-container">
                    <input
                      type="checkbox"
                      checked={gridSettings.showGrid}
                      onChange={(e) => setGridSettings({ ...gridSettings, showGrid: e.target.checked })}
                    />
                    <span className="switch-slider" />
                  </div>
                </label>
              </div>
              <div className="form-group">
                <label className="switch-label">
                  <span>Ajustar a la Rejilla</span>
                  <div className="switch-container">
                    <input
                      type="checkbox"
                      checked={gridSettings.snapToGrid}
                      onChange={(e) => setGridSettings({ ...gridSettings, snapToGrid: e.target.checked })}
                    />
                    <span className="switch-slider" />
                  </div>
                </label>
              </div>
              {gridSettings.snapToGrid && (
                <div className="form-group">
                  <label>Tamaño de Ajuste (cm)</label>
                  <select
                    value={gridSettings.snapSize}
                    onChange={(e) => setGridSettings({ ...gridSettings, snapSize: parseInt(e.target.value) })}
                    className="form-select"
                  >
                    <option value="5">5 cm</option>
                    <option value="10">10 cm</option>
                    <option value="20">20 cm</option>
                    <option value="50">50 cm</option>
                  </select>
                </div>
              )}
            </div>

            {/* Bill of Materials list */}
            <div className="sidebar-section">
              <div className="section-title">Lista de Mobiliario ({objects.length})</div>
              {objects.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                  No hay muebles colocados.
                </div>
              ) : (
                <div className="bom-list">
                  {objects.map((obj) => (
                    <div
                      key={obj.id}
                      className="bom-item"
                      style={{ cursor: 'pointer', borderColor: selectedId === obj.id ? 'var(--color-primary)' : 'var(--border-thin)' }}
                      onClick={() => setSelectedId(obj.id)}
                    >
                      <div className="bom-item-info">
                        <span className="bom-item-name">{obj.name}</span>
                        <span className="bom-item-dims">
                          {toUnitValue(obj.width)}x{toUnitValue(obj.height)} {unit}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: obj.color, fontWeight: 'bold' }}>
                        {obj.type.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts guide */}
            <div className="sidebar-section">
              <div className="section-title">Atajos de Teclado</div>
              <div className="keyboard-shortcuts-list">
                <div className="shortcut-row">
                  <span>Mover item</span>
                  <span className="shortcut-key">↑ ↓ ← →</span>
                </div>
                <div className="shortcut-row">
                  <span>Mover rápido (10cm)</span>
                  <span className="shortcut-key">Shift + Flechas</span>
                </div>
                <div className="shortcut-row">
                  <span>Eliminar item</span>
                  <span className="shortcut-key">Supr / Backspace</span>
                </div>
                <div className="shortcut-row">
                  <span>Deseleccionar</span>
                  <span className="shortcut-key">Esc</span>
                </div>
                <div className="shortcut-row">
                  <span>Deshacer / Rehacer</span>
                  <span className="shortcut-key">Ctrl+Z / Ctrl+Y</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
