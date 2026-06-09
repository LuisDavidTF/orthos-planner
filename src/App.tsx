import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftSidebar, RightSidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { ToastContainer, CustomModal } from './components/Alerts';
import type { ToastMessage, ModalConfig } from './components/Alerts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { RoomObject, RoomSettings, ObjectType, EditorState, GridSettings, Unit } from './types';

// Predefined starting layout for demonstration
const INITIAL_ROOM_SETTINGS: RoomSettings = {
  vertices: [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 350 },
    { x: 0, y: 350 }
  ],
  unit: 'cm',
};

const INITIAL_OBJECTS: RoomObject[] = [
  {
    id: 'obj-bed',
    type: 'bed',
    name: 'Cama Queen',
    x: 120,
    y: 20,
    width: 160,
    height: 200,
    rotation: 0,
    color: '#6366f1',
    zIndex: 2,
  },
  {
    id: 'obj-night-l',
    type: 'nightstand',
    name: 'Buró Izq',
    x: 60,
    y: 20,
    width: 50,
    height: 45,
    rotation: 0,
    color: '#38bdf8',
    zIndex: 1,
  },
  {
    id: 'obj-night-r',
    type: 'nightstand',
    name: 'Buró Der',
    x: 290,
    y: 20,
    width: 50,
    height: 45,
    rotation: 0,
    color: '#38bdf8',
    zIndex: 1,
  },
  {
    id: 'obj-desk',
    type: 'table',
    name: 'Escritorio',
    x: 260,
    y: 260,
    width: 120,
    height: 75,
    rotation: 180,
    color: '#f59e0b',
    zIndex: 2,
  },
  {
    id: 'obj-chair',
    type: 'chair',
    name: 'Silla',
    x: 297,
    y: 205,
    width: 45,
    height: 45,
    rotation: 180,
    color: '#f59e0b',
    zIndex: 3,
  },
  {
    id: 'obj-closet',
    type: 'wardrobe',
    name: 'Ropero',
    x: 20,
    y: 120,
    width: 60,
    height: 150,
    rotation: 90,
    color: '#8b5cf6',
    zIndex: 1,
  },
  {
    id: 'obj-door',
    type: 'door',
    name: 'Puerta Principal',
    x: 340,
    y: 0,
    width: 80,
    height: 8,
    rotation: 0,
    color: '#ef4444',
    zIndex: 10,
  },
  {
    id: 'obj-window',
    type: 'window',
    name: 'Ventana',
    x: 140,
    y: 342,
    width: 120,
    height: 15,
    rotation: 0,
    color: '#ec4899',
    zIndex: 10,
  },
  {
    id: 'obj-text',
    type: 'text',
    name: 'Nota',
    x: 150,
    y: 120,
    width: 100,
    height: 40,
    rotation: 0,
    color: '#a1a1aa',
    text: 'Mi Habitación',
    zIndex: 5,
  },
];

export const App: React.FC = () => {
  // Main states
  const [roomSettings, setRoomSettings] = useState<RoomSettings>(INITIAL_ROOM_SETTINGS);
  const [objects, setObjects] = useState<RoomObject[]>(INITIAL_OBJECTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Collapsible Sidebars states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  // Auto-collapse sidebars on smaller screens (mobiles & tablets)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else {
        setLeftSidebarOpen(true);
        setRightSidebarOpen(true);
      }
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Alerts and Modals states
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToasts((prev) => [...prev, { id: `toast-${Date.now()}-${Math.random()}`, type, text }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
    });
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm,
    });
  };
  
  // View states
  const [unit, setUnit] = useState<Unit>('cm');
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    showGrid: true,
    snapToGrid: true,
    snapSize: 10,
  });

  // History states
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Initialize history with starting layout
  useEffect(() => {
    const initialState: EditorState = {
      roomSettings: INITIAL_ROOM_SETTINGS,
      objects: INITIAL_OBJECTS,
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  }, []);

  // Sync active view unit with roomSettings unit
  useEffect(() => {
    setRoomSettings((prev) => ({ ...prev, unit }));
  }, [unit]);

  // Push state to Undo/Redo history stack
  const commitToHistory = (newSettings: RoomSettings, newObjects: RoomObject[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    const snapshot: EditorState = {
      roomSettings: JSON.parse(JSON.stringify(newSettings)),
      objects: JSON.parse(JSON.stringify(newObjects)),
    };
    setHistory([...nextHistory, snapshot]);
    setHistoryIndex(nextHistory.length);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      setRoomSettings(state.roomSettings);
      setObjects(state.objects);
      setUnit(state.roomSettings.unit);
      setHistoryIndex(prevIndex);
      setSelectedId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setRoomSettings(state.roomSettings);
      setObjects(state.objects);
      setUnit(state.roomSettings.unit);
      setHistoryIndex(nextIndex);
      setSelectedId(null);
    }
  };

  // Keyboard undo/redo bindings
  useEffect(() => {
    const handleUndoRedoKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleUndoRedoKeys);
    return () => window.removeEventListener('keydown', handleUndoRedoKeys);
  }, [historyIndex, history]);

  // Zoom / Pan resets
  const resetZoomAndPan = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Clear Canvas
  const clearCanvas = () => {
    triggerConfirm(
      'Vaciar Habitación',
      '¿Estás seguro de que deseas vaciar el cuarto? Se eliminarán todos los objetos permanentemente del plano.',
      () => {
        setObjects([]);
        commitToHistory(roomSettings, []);
        setSelectedId(null);
        addToast('Habitación vaciada correctamente', 'info');
      }
    );
  };

  // Add Object
  const addObject = (type: ObjectType) => {
    const id = `obj-${Date.now()}`;
    
    // Get default name
    const count = objects.filter((o) => o.type === type).length + 1;
    const typeLabel =
      type === 'bed' ? 'Cama' :
      type === 'nightstand' ? 'Buró' :
      type === 'dresser' ? 'Tocador' :
      type === 'stairs' ? 'Escalera' :
      type === 'box' ? 'Caja' :
      type === 'door' ? 'Puerta' :
      type === 'window' ? 'Ventana' :
      type === 'sofa' ? 'Sofá' :
      type === 'table' ? 'Escritorio' :
      type === 'chair' ? 'Silla' :
      type === 'wardrobe' ? 'Ropero' : 'Nota';
      
    const name = `${typeLabel} ${count}`;

    // Get default sizing
    let w = 80;
    let h = 80;
    let color = '#6366f1';

    switch (type) {
      case 'bed': w = 140; h = 190; color = '#6366f1'; break;
      case 'nightstand': w = 50; h = 45; color = '#38bdf8'; break;
      case 'dresser': w = 120; h = 50; color = '#38bdf8'; break;
      case 'wardrobe': w = 150; h = 60; color = '#8b5cf6'; break;
      case 'sofa': w = 180; h = 90; color = '#10b981'; break;
      case 'table': w = 120; h = 75; color = '#f59e0b'; break;
      case 'chair': w = 45; h = 45; color = '#f59e0b'; break;
      case 'stairs': w = 80; h = 200; color = '#a1a1aa'; break;
      case 'door': w = 80; h = 8; color = '#ef4444'; break;
      case 'window': w = 120; h = 15; color = '#ec4899'; break;
      case 'box': w = 50; h = 50; color = '#a1a1aa'; break;
      case 'text': w = 100; h = 40; color = '#a1a1aa'; break;
    }

    // Spawn at room center (computed from bounding box of vertices)
    const vertices = roomSettings.vertices || [];
    const minX = vertices.length > 0 ? Math.min(...vertices.map(v => v.x)) : 0;
    const maxX = vertices.length > 0 ? Math.max(...vertices.map(v => v.x)) : 400;
    const minY = vertices.length > 0 ? Math.min(...vertices.map(v => v.y)) : 0;
    const maxY = vertices.length > 0 ? Math.max(...vertices.map(v => v.y)) : 350;
    const roomWidthCm = maxX - minX;
    const roomHeightCm = maxY - minY;

    const x = Math.round(minX + (roomWidthCm - w) / 2);
    const y = Math.round(minY + (roomHeightCm - h) / 2);

    const newObj: RoomObject = {
      id,
      type,
      name,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: w,
      height: h,
      rotation: 0,
      color,
      text: type === 'text' ? 'Nota' : undefined,
      zIndex: objects.length > 0 ? Math.max(...objects.map((o) => o.zIndex)) + 1 : 1,
    };

    const newObjects = [...objects, newObj];
    setObjects(newObjects);
    commitToHistory(roomSettings, newObjects);
    setSelectedId(id);
    addToast(`Añadido: ${name}`, 'success');
  };

  // Update Object (handles real-time drags and manual edits)
  const updateObject = (id: string, updates: Partial<RoomObject>) => {
    let changed = false;
    const updated = objects.map((obj) => {
      if (obj.id === id) {
        // Check if any value is actually changing
        const isChanging = Object.entries(updates).some(([k, v]) => (obj as any)[k] !== v);
        if (isChanging) {
          changed = true;
          return { ...obj, ...updates };
        }
      }
      return obj;
    });

    if (changed) {
      setObjects(updated);
      
      // Save history for manual properties inputs immediately.
      // Drag & scale calls updateObject continuously, which we commit on drag release.
      const isDraggingOrResizing = Object.keys(updates).some(
        (key) => key === 'x' || key === 'y' || key === 'width' || key === 'height' || key === 'rotation'
      );
      
      // If updating label, color, text or layering, commit to history immediately
      if (!isDraggingOrResizing) {
        commitToHistory(roomSettings, updated);
      }
    }
  };

  // Commit history on mouse/drag end
  const handleDragRelease = () => {
    // Check if the current canvas state matches the last history state
    const lastHistory = history[historyIndex];
    if (lastHistory) {
      const objectsChanged = JSON.stringify(lastHistory.objects) !== JSON.stringify(objects);
      const settingsChanged = JSON.stringify(lastHistory.roomSettings) !== JSON.stringify(roomSettings);
      
      if (objectsChanged || settingsChanged) {
        commitToHistory(roomSettings, objects);
      }
    }
  };

  // Trigger history commit when room settings are modified
  const handleRoomSettingsChange = (newSettings: RoomSettings) => {
    setRoomSettings(newSettings);
    commitToHistory(newSettings, objects);
  };

  // Delete Object
  const deleteObject = (id: string) => {
    const obj = objects.find((o) => o.id === id);
    const filtered = objects.filter((o) => o.id !== id);
    setObjects(filtered);
    commitToHistory(roomSettings, filtered);
    if (selectedId === id) setSelectedId(null);
    if (obj) {
      addToast(`Eliminado: ${obj.name}`, 'info');
    }
  };

  // Duplicate Object
  const duplicateObject = (id: string) => {
    const obj = objects.find((o) => o.id === id);
    if (!obj) return;

    const clonedId = `obj-${Date.now()}`;
    const cloned: RoomObject = {
      ...obj,
      id: clonedId,
      name: `${obj.name} (Copia)`,
      // Shift position slightly to avoid perfect overlap (using vertex bounding box)
      x: Math.min((roomSettings.vertices.length > 0 ? Math.max(...roomSettings.vertices.map(v => v.x)) : 400) - obj.width, obj.x + 20),
      y: Math.min((roomSettings.vertices.length > 0 ? Math.max(...roomSettings.vertices.map(v => v.y)) : 350) - obj.height, obj.y + 20),
      zIndex: Math.max(...objects.map((o) => o.zIndex)) + 1,
    };

    const newObjects = [...objects, cloned];
    setObjects(newObjects);
    commitToHistory(roomSettings, newObjects);
    setSelectedId(clonedId);
    addToast(`Duplicado: ${obj.name}`, 'success');
  };

  // Keyboard shortcut binding for Duplicate (Ctrl + D)
  useEffect(() => {
    const handleDuplicateKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === 'd' || e.key === 'D') {
          if (selectedId) {
            e.preventDefault();
            duplicateObject(selectedId);
          }
        }
      }
    };
    window.addEventListener('keydown', handleDuplicateKey);
    return () => window.removeEventListener('keydown', handleDuplicateKey);
  }, [selectedId, duplicateObject]);

  // Export JSON
  const exportJSON = () => {
    const dataStr = JSON.stringify({ roomSettings, objects }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plano-habitacion.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Plano guardado como JSON', 'success');
  };

  // Import JSON
  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.roomSettings && Array.isArray(parsed.objects)) {
          // Soft validation
          let validatedVertices = [];
          if (Array.isArray(parsed.roomSettings?.vertices)) {
            validatedVertices = parsed.roomSettings.vertices.map((v: any) => ({
              x: Number(v.x) || 0,
              y: Number(v.y) || 0,
            }));
          }
          if (validatedVertices.length < 3) {
            // Fallback for backward compatibility (older width/height rect rooms)
            const w = Number(parsed.roomSettings?.width) || 400;
            const h = Number(parsed.roomSettings?.height) || 350;
            validatedVertices = [
              { x: 0, y: 0 },
              { x: w, y: 0 },
              { x: w, y: h },
              { x: 0, y: h }
            ];
          }
          const validatedSettings: RoomSettings = {
            vertices: validatedVertices,
            unit: parsed.roomSettings?.unit || 'cm',
          };
          
          const validatedObjects: RoomObject[] = parsed.objects.map((o: any, idx: number) => ({
            id: o.id || `obj-imported-${idx}`,
            type: o.type || 'box',
            name: o.name || 'Objeto',
            x: Number(o.x) || 0,
            y: Number(o.y) || 0,
            width: Number(o.width) || 50,
            height: Number(o.height) || 50,
            rotation: Number(o.rotation) || 0,
            color: o.color || '#6366f1',
            text: o.text,
            zIndex: Number(o.zIndex) || idx + 1,
          }));

          setRoomSettings(validatedSettings);
          setObjects(validatedObjects);
          setUnit(validatedSettings.unit);
          commitToHistory(validatedSettings, validatedObjects);
          setSelectedId(null);
          addToast('¡Proyecto cargado exitosamente!', 'success');
        } else {
          triggerAlert('Archivo no válido', 'El archivo JSON no tiene un formato estructurado correcto para el planificador.');
        }
      } catch (err) {
        addToast('Error al leer el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  // Export SVG
  const exportSVG = () => {
    const svgEl = document.querySelector('.svg-canvas') as SVGSVGElement | null;
    if (!svgEl) return;

    // Clone element to modify styling values without altering active workspace canvas
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
    
    // Set absolute sizes for standard SVG viewers instead of scaling transforms
    const margin = 30; // 30cm margin on all sides for drawing padding
    const vertices = roomSettings.vertices || [];
    const minX = vertices.length > 0 ? Math.min(...vertices.map(v => v.x)) : 0;
    const maxX = vertices.length > 0 ? Math.max(...vertices.map(v => v.x)) : 400;
    const minY = vertices.length > 0 ? Math.min(...vertices.map(v => v.y)) : 0;
    const maxY = vertices.length > 0 ? Math.max(...vertices.map(v => v.y)) : 350;
    const boundingW = maxX - minX;
    const boundingH = maxY - minY;

    const exportW = boundingW + 2 * margin;
    const exportH = boundingH + 2 * margin;

    clonedSvg.setAttribute('width', `${exportW}`);
    clonedSvg.setAttribute('height', `${exportH}`);
    clonedSvg.setAttribute('viewBox', `${-margin} ${-margin} ${exportW} ${exportH}`);
    
    // Clear scaling transforms and workspace rulers since we export the clean floorplan
    clonedSvg.style.transform = '';
    
    // Remove selected controls handles and editor overlays from export SVG output
    const selectionElements = clonedSvg.querySelectorAll('.svg-selection-border, .svg-handle, .svg-handle-line, .editor-corner-handle, .editor-split-handle');
    selectionElements.forEach((el) => el.remove());

    // Remove the scale(renderScale) factor from the main group transformation!
    const innerGroup = clonedSvg.querySelector('g');
    if (innerGroup) {
      innerGroup.setAttribute('transform', `translate(${-minX}, ${-minY})`);
    }

    const svgString = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plano-habitacion.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export PNG
  const exportPNG = () => {
    const svgEl = document.querySelector('.svg-canvas') as SVGSVGElement | null;
    if (!svgEl) return;

    // Scale canvas export factor for high resolution PNG
    const exportScale = 2;
    const margin = 30; // 30cm margin on all sides for drawing padding
    const vertices = roomSettings.vertices || [];
    const minX = vertices.length > 0 ? Math.min(...vertices.map(v => v.x)) : 0;
    const maxX = vertices.length > 0 ? Math.max(...vertices.map(v => v.x)) : 400;
    const minY = vertices.length > 0 ? Math.min(...vertices.map(v => v.y)) : 0;
    const maxY = vertices.length > 0 ? Math.max(...vertices.map(v => v.y)) : 350;
    const boundingW = maxX - minX;
    const boundingH = maxY - minY;

    const exportW = boundingW + 2 * margin;
    const exportH = boundingH + 2 * margin;

    const width = exportW * exportScale;
    const height = exportH * exportScale;

    // Clone and strip selection controls
    const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
    
    // Remove selection controls handles from exported PNG
    const selectionElements = clonedSvg.querySelectorAll('.svg-selection-border, .svg-handle, .svg-handle-line, .editor-corner-handle, .editor-split-handle');
    selectionElements.forEach((el) => el.remove());

    // Remove the scale(renderScale) factor from the main group transformation!
    const innerGroup = clonedSvg.querySelector('g');
    if (innerGroup) {
      innerGroup.setAttribute('transform', `translate(${-minX}, ${-minY})`);
    }

    // Scale the actual elements inside the SVG string for PNG export
    clonedSvg.setAttribute('width', `${width}`);
    clonedSvg.setAttribute('height', `${height}`);
    clonedSvg.setAttribute('viewBox', `${-margin} ${-margin} ${exportW} ${exportH}`);
    
    // Find grid lines and objects inside SVG and apply scaled rendering
    const svgContent = new XMLSerializer().serializeToString(clonedSvg);
    
    // Safe XML to Blob converter
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (context) {
        // Fill base dark background
        context.fillStyle = '#0d1220';
        context.fillRect(0, 0, width, height);
        // Draw the vector blueprint
        context.drawImage(image, 0, 0);
        
        try {
          const pngURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngURL;
          downloadLink.download = 'plano-habitacion.png';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          addToast('Plano imagen PNG exportado', 'success');
        } catch (e) {
          addToast('Error de exportación PNG', 'error');
        }
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="app-container" onMouseUp={handleDragRelease}>
      {/* Top toolbar */}
      <Header
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={zoom}
        setZoom={setZoom}
        resetZoomAndPan={resetZoomAndPan}
        clearCanvas={clearCanvas}
        exportJSON={exportJSON}
        importJSON={importJSON}
        exportSVG={exportSVG}
        exportPNG={exportPNG}
      />

      {/* Main workspaces layout */}
      <div className="workspace-container">
        {/* Left toggle button */}
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          style={{
            position: 'fixed',
            left: leftSidebarOpen ? '348px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 99,
            background: 'rgba(21, 29, 48, 0.95)',
            border: '1px solid var(--border-thin)',
            color: 'var(--text-primary)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s',
          }}
          aria-label={leftSidebarOpen ? "Contraer panel de herramientas izquierdo" : "Expandir panel de herramientas izquierdo"}
          aria-expanded={leftSidebarOpen}
          aria-controls="left-sidebar"
        >
          {leftSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Left pane: settings, preset library */}
        <LeftSidebar
          roomSettings={roomSettings}
          setRoomSettings={handleRoomSettingsChange}
          addObject={addObject}
          unit={unit}
          setUnit={setUnit}
          isOpen={leftSidebarOpen}
        />

        {/* Center pane: SVG drawing area */}
        <Canvas
          roomSettings={roomSettings}
          setRoomSettings={handleRoomSettingsChange}
          objects={objects}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          updateObject={updateObject}
          deleteObject={deleteObject}
          gridSettings={gridSettings}
          zoom={zoom}
          setZoom={setZoom}
          panX={panX}
          setPanX={setPanX}
          panY={panY}
          setPanY={setPanY}
          unit={unit}
          onAlert={triggerAlert}
          onConfirm={triggerConfirm}
        />

        {/* Right toggle button */}
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          style={{
            position: 'fixed',
            right: rightSidebarOpen ? '348px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 99,
            background: 'rgba(21, 29, 48, 0.95)',
            border: '1px solid var(--border-thin)',
            color: 'var(--text-primary)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-lg)',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s',
          }}
          aria-label={rightSidebarOpen ? "Contraer inspector de propiedades derecho" : "Expandir inspector de propiedades derecho"}
          aria-expanded={rightSidebarOpen}
          aria-controls="right-sidebar"
        >
          {rightSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Right pane: inspector properties, checklists */}
        <RightSidebar
          roomSettings={roomSettings}
          objects={objects}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          updateObject={updateObject}
          deleteObject={deleteObject}
          duplicateObject={duplicateObject}
          unit={unit}
          setUnit={setUnit}
          gridSettings={gridSettings}
          setGridSettings={setGridSettings}
          isOpen={rightSidebarOpen}
        />
      </div>

      {/* Custom Modal overlay */}
      <CustomModal config={modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />

      {/* Floating notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};
