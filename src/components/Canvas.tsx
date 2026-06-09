import React, { useState, useRef, useEffect } from 'react';
import type { RoomObject, RoomSettings, GridSettings, Unit, Point } from '../types';
import { FurnitureSymbol } from './FurnitureSymbols';
import { Keyboard } from 'lucide-react';

interface CanvasProps {
  roomSettings: RoomSettings;
  setRoomSettings: (settings: RoomSettings) => void;
  objects: RoomObject[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  updateObject: (id: string, updates: Partial<RoomObject>) => void;
  deleteObject: (ids: string | string[]) => void;
  gridSettings: GridSettings;
  zoom: number;
  setZoom: (zoom: number) => void;
  panX: number;
  setPanX: (panX: number) => void;
  panY: number;
  setPanY: (panY: number) => void;
  unit: Unit;
  onAlert: (title: string, message: string) => void;
  onConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onContextMenu: (clientX: number, clientY: number, targetId: string | null, canvasCoords: Point) => void;
  onShowShortcuts: () => void;
}

const getObjectCorners = (obj: RoomObject): Point[] => {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const theta = (obj.rotation * Math.PI) / 180;
  
  const halfW = obj.width / 2;
  const halfH = obj.height / 2;
  
  const localCorners = obj.type === 'door' ? [
    { x: -halfW, y: -halfH },           // Top-left
    { x: halfW, y: -halfH },            // Top-right
    { x: halfW, y: obj.width - halfH }, // Bottom-right (swing arc extends to obj.width)
    { x: -halfW, y: obj.width - halfH },// Bottom-left (swing arc extends to obj.width)
  ] : [
    { x: -halfW, y: -halfH }, // Top-left
    { x: halfW, y: -halfH },  // Top-right
    { x: halfW, y: halfH },   // Bottom-right
    { x: -halfW, y: halfH },  // Bottom-left
  ];
  
  return localCorners.map((pt) => ({
    x: cx + pt.x * Math.cos(theta) - pt.y * Math.sin(theta),
    y: cy + pt.x * Math.sin(theta) + pt.y * Math.cos(theta),
  }));
};

export const Canvas: React.FC<CanvasProps> = ({
  roomSettings,
  setRoomSettings,
  objects,
  selectedId,
  setSelectedId,
  selectedIds,
  setSelectedIds,
  updateObject,
  deleteObject,
  gridSettings,
  zoom,
  setZoom,
  panX,
  setPanX,
  panY,
  setPanY,
  unit,
  onAlert,
  onConfirm,
  onContextMenu,
  onShowShortcuts,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperSize, setWrapperSize] = useState({ width: 800, height: 600 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [dragState, setDragState] = useState<{
    type: 'idle' | 'drag-obj' | 'resize-obj' | 'rotate-obj' | 'pan' | 'drag-vertex' | 'select-box';
    startX: number;
    startY: number;
    startObjX?: number;
    startObjY?: number;
    startObjW?: number;
    startObjH?: number;
    startObjR?: number;
    vertexIndex?: number;
    startVertexX?: number;
    startVertexY?: number;
    startCanvasX?: number;
    startCanvasY?: number;
    currentCanvasX?: number;
    currentCanvasY?: number;
    startPositions?: { id: string; x: number; y: number }[];
    startSelectedIds?: string[];
  }>({ type: 'idle', startX: 0, startY: 0 });

  // Get active vertices
  const vertices = roomSettings.vertices && roomSettings.vertices.length >= 3
    ? roomSettings.vertices
    : [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 350 },
        { x: 0, y: 350 }
      ];

  // Watch container dimensions to center layout
  useEffect(() => {
    if (!wrapperRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWrapperSize({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 600,
        });
      }
    });
    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Keyboard Spacebar listener for canvas panning (Figma-style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        setSpacePressed(true);
        e.preventDefault(); // Prevent page scroll down
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Compute room bounding box in cm
  const minX = Math.min(...vertices.map((v) => v.x));
  const maxX = Math.max(...vertices.map((v) => v.x));
  const minY = Math.min(...vertices.map((v) => v.y));
  const maxY = Math.max(...vertices.map((v) => v.y));

  const roomWidthCm = maxX - minX || 400;
  const roomHeightCm = maxY - minY || 350;

  // Base scale: pixels per cm. Fit room bounding box within wrapper with padding
  const padding = 120;
  const baseScaleX = (wrapperSize.width - padding) / roomWidthCm;
  const baseScaleY = (wrapperSize.height - padding) / roomHeightCm;
  const baseScale = Math.min(baseScaleX, baseScaleY, 2.5); // Cap base scale at 2.5px/cm
  const renderScale = baseScale * zoom;

  // Center room bounds inside wrapper
  const roomW = roomWidthCm * renderScale;
  const roomH = roomHeightCm * renderScale;
  const offsetX = (wrapperSize.width - roomW) / 2 + panX;
  const offsetY = (wrapperSize.height - roomH) / 2 + panY;

  const selectedObj = objects.find((o) => o.id === selectedId);

  // Conversion helpers for dimensions text
  const formatValue = (cmVal: number) => {
    switch (unit) {
      case 'm':
        return `${(cmVal / 100).toFixed(2)} m`;
      case 'in':
        return `${Math.round(cmVal / 2.54)} in`;
      case 'ft': {
        const totalIn = cmVal / 2.54;
        const feet = Math.floor(totalIn / 12);
        const inches = Math.round(totalIn % 12);
        return `${feet}' ${inches}"`;
      }
      case 'cm':
      default:
        return `${Math.round(cmVal)} cm`;
    }
  };

  // Keyboard controls for deletion, escape, nudges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIds.length === 0) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const step = e.shiftKey ? 10 : 1; // Nudge by 1cm or 10cm

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          deleteObject(selectedIds);
          break;
        case 'Escape':
          setSelectedIds([]);
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectedIds.forEach((id) => {
            const obj = objects.find((o) => o.id === id);
            if (obj) updateObject(id, { y: obj.y - step });
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          selectedIds.forEach((id) => {
            const obj = objects.find((o) => o.id === id);
            if (obj) updateObject(id, { y: obj.y + step });
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          selectedIds.forEach((id) => {
            const obj = objects.find((o) => o.id === id);
            if (obj) updateObject(id, { x: obj.x - step });
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          selectedIds.forEach((id) => {
            const obj = objects.find((o) => o.id === id);
            if (obj) updateObject(id, { x: obj.x + step });
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, objects, deleteObject, updateObject, setSelectedIds]);

  // Translate client coordinates to Canvas room coordinates (in cm)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!wrapperRef.current) return { x: 0, y: 0 };
    const rect = wrapperRef.current.getBoundingClientRect();
    const xPx = clientX - rect.left - offsetX;
    const yPx = clientY - rect.top - offsetY;
    
    // Reverse the scale and translation offset of minX/minY
    return {
      x: xPx / renderScale + minX,
      y: yPx / renderScale + minY,
    };
  };

  // Drag and manipulation triggers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const isBackground = target.classList.contains('canvas-bg-hitbox') || target.classList.contains('canvas-wrapper-hitbox');
    
    if (isBackground) {
      if (e.button === 0) { // left click
        if (spacePressed) {
          // Panning canvas
          setDragState({
            type: 'pan',
            startX: e.clientX,
            startY: e.clientY,
          });
        } else {
          // Start selection box dragging (default behavior)
          const coords = getCanvasCoords(e.clientX, e.clientY);
          setDragState({
            type: 'select-box',
            startX: e.clientX,
            startY: e.clientY,
            startCanvasX: coords.x,
            startCanvasY: coords.y,
            currentCanvasX: coords.x,
            currentCanvasY: coords.y,
            startSelectedIds: [...selectedIds],
          });
        }
      } else if (e.button === 1 || e.button === 2) {
        // Middle or right click drag pans canvas
        setDragState({
          type: 'pan',
          startX: e.clientX,
          startY: e.clientY,
        });
      }
      return;
    }
  };

  const handleObjMouseDown = (e: React.MouseEvent, obj: RoomObject) => {
    e.stopPropagation();
    
    // Right click selection adjustment: do NOT trigger drag state on right click (button 2)
    if (e.button === 2) {
      if (!selectedIds.includes(obj.id)) {
        setSelectedIds([obj.id]);
      }
      return;
    }

    if (e.button !== 0) return; // Only allow left click for dragging
    
    let nextIds = [...selectedIds];
    const isModifier = e.shiftKey || e.ctrlKey;
    
    if (isModifier) {
      if (nextIds.includes(obj.id)) {
        nextIds = nextIds.filter((id) => id !== obj.id);
      } else {
        nextIds.push(obj.id);
      }
    } else {
      if (!nextIds.includes(obj.id)) {
        nextIds = [obj.id];
      }
    }
    
    setSelectedIds(nextIds);
    
    const startPositions = objects
      .filter((o) => nextIds.includes(o.id))
      .map((o) => ({ id: o.id, x: o.x, y: o.y }));

    setDragState({
      type: 'drag-obj',
      startX: e.clientX,
      startY: e.clientY,
      startObjX: obj.x,
      startObjY: obj.y,
      startPositions,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, obj: RoomObject) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      type: 'resize-obj',
      startX: e.clientX,
      startY: e.clientY,
      startObjW: obj.width,
      startObjH: obj.height,
      startObjX: obj.x,
      startObjY: obj.y,
    });
  };

  const handleRotateMouseDown = (e: React.MouseEvent, obj: RoomObject) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      type: 'rotate-obj',
      startX: e.clientX,
      startY: e.clientY,
      startObjR: obj.rotation,
    });
  };

  const handleVertexMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      type: 'drag-vertex',
      startX: e.clientX,
      startY: e.clientY,
      vertexIndex: index,
      startVertexX: vertices[index].x,
      startVertexY: vertices[index].y,
    });
  };

  const handleVertexDoubleClick = (index: number) => {
    if (vertices.length <= 3) {
      onAlert('Límite de esquinas', 'Un cuarto debe tener al menos 3 esquinas para formar un espacio cerrado.');
      return;
    }
    onConfirm(
      'Eliminar esquina',
      '¿Deseas eliminar esta esquina del cuarto? Las paredes adyacentes se conectarán directamente.',
      () => {
        const newVertices = vertices.filter((_, i) => i !== index);
        setRoomSettings({
          ...roomSettings,
          vertices: newVertices,
        });
        setSelectedId(null);
      }
    );
  };

  const handleSplitWall = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const nextIdx = (index + 1) % vertices.length;
    const p1 = vertices[index];
    const p2 = vertices[nextIdx];
    
    const newVertex: Point = {
      x: Math.round((p1.x + p2.x) / 2),
      y: Math.round((p1.y + p2.y) / 2),
    };

    const newVertices = [...vertices];
    newVertices.splice(index + 1, 0, newVertex);
    setRoomSettings({
      ...roomSettings,
      vertices: newVertices,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.type === 'idle') return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    // Convert pixels delta to centimeters delta
    const dxCm = dx / renderScale;
    const dyCm = dy / renderScale;

    if (dragState.type === 'pan') {
      setPanX(panX + dx);
      setPanY(panY + dy);
      setDragState((prev) => ({ ...prev, startX: e.clientX, startY: e.clientY }));
      return;
    }

    if (dragState.type === 'select-box') {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const startX = dragState.startCanvasX || 0;
      const startY = dragState.startCanvasY || 0;
      const xMin = Math.min(startX, coords.x);
      const xMax = Math.max(startX, coords.x);
      const yMin = Math.min(startY, coords.y);
      const yMax = Math.max(startY, coords.y);

      const dragWidth = xMax - xMin;
      const dragHeight = yMax - yMin;

      let nextIds: string[] = [];

      if (dragWidth >= 3 || dragHeight >= 3) {
        // Find all objects whose rotated bounding box touches/overlaps the selection box in real-time
        const newlySelected = objects
          .filter((obj) => {
            const corners = getObjectCorners(obj);
            const objMinX = Math.min(...corners.map((c) => c.x));
            const objMaxX = Math.max(...corners.map((c) => c.x));
            const objMinY = Math.min(...corners.map((c) => c.y));
            const objMaxY = Math.max(...corners.map((c) => c.y));
            
            return !(objMaxX < xMin || objMinX > xMax || objMaxY < yMin || objMinY > yMax);
          })
          .map((obj) => obj.id);

        const isModifier = e.shiftKey || e.ctrlKey;
        const baseIds = dragState.startSelectedIds || [];
        if (isModifier) {
          // Toggle selection logic: toggle items in marquee relative to initial selection state
          const combined = [...baseIds];
          newlySelected.forEach((id) => {
            if (combined.includes(id)) {
              combined.splice(combined.indexOf(id), 1);
            } else {
              combined.push(id);
            }
          });
          nextIds = combined;
        } else {
          nextIds = newlySelected;
        }
      } else {
        // If the box is too small, revert to start selected state
        nextIds = dragState.startSelectedIds || [];
      }

      setSelectedIds(nextIds);

      setDragState((prev) => ({
        ...prev,
        currentCanvasX: coords.x,
        currentCanvasY: coords.y,
      }));
      return;
    }

    if (dragState.type === 'drag-vertex') {
      const idx = dragState.vertexIndex;
      if (idx === undefined) return;

      let newX = (dragState.startVertexX || 0) + dxCm;
      let newY = (dragState.startVertexY || 0) + dyCm;

      if (gridSettings.snapToGrid) {
        newX = Math.round(newX / gridSettings.snapSize) * gridSettings.snapSize;
        newY = Math.round(newY / gridSettings.snapSize) * gridSettings.snapSize;
      }

      // Range limits
      newX = Math.max(-500, Math.min(2500, newX));
      newY = Math.max(-500, Math.min(2500, newY));

      const newVertices = vertices.map((v, i) => (i === idx ? { x: newX, y: newY } : v));
      setRoomSettings({
        ...roomSettings,
        vertices: newVertices,
      });
      return;
    }

    if (!selectedId) return;
    const obj = objects.find((o) => o.id === selectedId);
    if (!obj) return;

    if (dragState.type === 'drag-obj') {
      if (dragState.startPositions && dragState.startPositions.length > 0) {
        dragState.startPositions.forEach((pos) => {
          const targetObj = objects.find((o) => o.id === pos.id);
          const objW = targetObj ? targetObj.width : 50;
          const objH = targetObj ? targetObj.height : 50;

          let newX = pos.x + dxCm;
          let newY = pos.y + dyCm;

          if (gridSettings.snapToGrid) {
            newX = Math.round(newX / gridSettings.snapSize) * gridSettings.snapSize;
            newY = Math.round(newY / gridSettings.snapSize) * gridSettings.snapSize;
          }

          newX = Math.max(minX - 100, Math.min(maxX - objW + 100, newX));
          newY = Math.max(minY - 100, Math.min(maxY - objH + 100, newY));

          updateObject(pos.id, { x: newX, y: newY });
        });
      } else {
        let newX = (dragState.startObjX || 0) + dxCm;
        let newY = (dragState.startObjY || 0) + dyCm;

        if (gridSettings.snapToGrid) {
          newX = Math.round(newX / gridSettings.snapSize) * gridSettings.snapSize;
          newY = Math.round(newY / gridSettings.snapSize) * gridSettings.snapSize;
        }

        newX = Math.max(minX - 100, Math.min(maxX - obj.width + 100, newX));
        newY = Math.max(minY - 100, Math.min(maxY - obj.height + 100, newY));

        updateObject(selectedId, { x: newX, y: newY });
      }
    } 
    else if (dragState.type === 'resize-obj') {
      // Local coordinate resize math for rotated objects
      const theta = (obj.rotation * Math.PI) / 180;
      const coords = getCanvasCoords(e.clientX, e.clientY);
      
      const relX = coords.x - obj.x;
      const relY = coords.y - obj.y;
      
      let localW = relX * Math.cos(-theta) - relY * Math.sin(-theta);
      let localH = relX * Math.sin(-theta) + relY * Math.cos(-theta);

      if (gridSettings.snapToGrid) {
        localW = Math.round(localW / gridSettings.snapSize) * gridSettings.snapSize;
        localH = Math.round(localH / gridSettings.snapSize) * gridSettings.snapSize;
      }

      const finalW = Math.max(10, Math.min(2000, localW));
      const finalH = Math.max(10, Math.min(2000, localH));

      updateObject(selectedId, { width: finalW, height: finalH });
    } 
    else if (dragState.type === 'rotate-obj') {
      // Rotate around object's center point
      const objCenterXPx = offsetX + (obj.x + obj.width / 2 - minX) * renderScale;
      const objCenterYPx = offsetY + (obj.y + obj.height / 2 - minY) * renderScale;
      
      const angleRad = Math.atan2(e.clientY - objCenterYPx, e.clientX - objCenterXPx);
      let angleDeg = (angleRad * 180) / Math.PI;

      // Top handle offset calibration
      angleDeg = (angleDeg - 90 + 360) % 360;

      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      } else if (gridSettings.snapToGrid) {
        const snap45 = Math.round(angleDeg / 45) * 45;
        if (Math.abs(angleDeg - snap45) < 6) {
          angleDeg = snap45;
        }
      }

      updateObject(selectedId, { rotation: Math.round(angleDeg) % 360 });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragState.type === 'select-box') {
      const xMin = Math.min(dragState.startCanvasX || 0, dragState.currentCanvasX || 0);
      const xMax = Math.max(dragState.startCanvasX || 0, dragState.currentCanvasX || 0);
      const yMin = Math.min(dragState.startCanvasY || 0, dragState.currentCanvasY || 0);
      const yMax = Math.max(dragState.startCanvasY || 0, dragState.currentCanvasY || 0);

      const dragWidth = xMax - xMin;
      const dragHeight = yMax - yMin;

      if (dragWidth < 3 && dragHeight < 3) {
        // Very small drag box -> treat as simple click on background
        const isModifier = e.shiftKey || e.ctrlKey;
        if (!isModifier) {
          setSelectedIds([]);
        }
      } else {
        // Find all objects whose rotated bounding box touches/overlaps the selection box
        const newlySelected = objects
          .filter((obj) => {
            const corners = getObjectCorners(obj);
            const objMinX = Math.min(...corners.map((c) => c.x));
            const objMaxX = Math.max(...corners.map((c) => c.x));
            const objMinY = Math.min(...corners.map((c) => c.y));
            const objMaxY = Math.max(...corners.map((c) => c.y));
            
            return !(objMaxX < xMin || objMinX > xMax || objMaxY < yMin || objMinY > yMax);
          })
          .map((obj) => obj.id);

        const isModifier = e.shiftKey || e.ctrlKey;
        if (isModifier) {
          // Toggle selection or merge
          const combined = [...selectedIds];
          newlySelected.forEach((id) => {
            if (combined.includes(id)) {
              combined.splice(combined.indexOf(id), 1);
            } else {
              combined.push(id);
            }
          });
          setSelectedIds(combined);
        } else {
          setSelectedIds(newlySelected);
        }
      }
    }
    setDragState({ type: 'idle', startX: 0, startY: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 4);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.4);
    }
    setZoom(newZoom);
  };

  // Generate grid lines within the bounding box of the room perimeters
  const renderGridLines = () => {
    if (!gridSettings.showGrid) return null;
    
    const lines = [];
    const step = 50; // Major grids (50cm)
    const subStep = 10; // Minor grids (10cm)

    // Snap starting position to grid subdivisions
    const startGridX = Math.floor(minX / subStep) * subStep;
    const endGridX = Math.ceil(maxX / subStep) * subStep;
    const startGridY = Math.floor(minY / subStep) * subStep;
    const endGridY = Math.ceil(maxY / subStep) * subStep;

    // Vertical lines
    for (let x = startGridX; x <= endGridX; x += subStep) {
      const isMajor = x % step === 0;
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={minY}
          x2={x}
          y2={maxY}
          stroke={isMajor ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.015)'}
          strokeWidth={isMajor ? 1 : 0.5}
          vectorEffect="non-scaling-stroke"
        />
      );
    }

    // Horizontal lines
    for (let y = startGridY; y <= endGridY; y += subStep) {
      const isMajor = y % step === 0;
      lines.push(
        <line
          key={`h-${y}`}
          x1={minX}
          y1={y}
          x2={maxX}
          y2={y}
          stroke={isMajor ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.015)'}
          strokeWidth={isMajor ? 1 : 0.5}
          vectorEffect="non-scaling-stroke"
        />
      );
    }

    return lines;
  };

  // Vector projection math to find intersections from object center to outer wall polygon segments
  const renderDistanceGuides = () => {
    if (!selectedObj) return null;

    const o = selectedObj;
    const corners = getObjectCorners(o);

    interface ObstacleSegment {
      p1: Point;
      p2: Point;
      id: string;
      type: 'wall' | 'object';
      name: string;
    }

    // Collect obstacle segments: walls + other objects
    const obstacleSegments: ObstacleSegment[] = [];

    // 1. Add room walls
    for (let i = 0; i < vertices.length; i++) {
      obstacleSegments.push({
        p1: vertices[i],
        p2: vertices[(i + 1) % vertices.length],
        id: `wall-${i}`,
        type: 'wall',
        name: `Pared ${i + 1}`,
      });
    }

    // 2. Add other furniture objects' bounds
    for (const obj of objects) {
      if (obj.id === o.id) continue;
      const cornersOther = getObjectCorners(obj);
      for (let i = 0; i < 4; i++) {
        obstacleSegments.push({
          p1: cornersOther[i],
          p2: cornersOther[(i + 1) % 4],
          id: obj.id,
          type: 'object',
          name: obj.name,
        });
      }
    }

    // Helper to find closest ray intersection with obstacle segments
    const getClosestIntersection = (S: Point, D: { x: number; y: number }) => {
      let minT: number | null = null;
      let closestPt: Point | null = null;
      let closestObstacle: ObstacleSegment | null = null;

      for (const seg of obstacleSegments) {
        const p1 = seg.p1;
        const p2 = seg.p2;

        const Vx = p2.x - p1.x;
        const Vy = p2.y - p1.y;

        const det = D.y * Vx - D.x * Vy;
        if (Math.abs(det) < 1e-6) continue; // Parallel

        const t = (Vy * (S.x - p1.x) - Vx * (S.y - p1.y)) / det;
        const u = (D.y * (S.x - p1.x) - D.x * (S.y - p1.y)) / det;

        if (t >= -1e-4 && u >= -1e-4 && u <= 1 + 1e-4) {
          if (minT === null || t < minT) {
            minT = t;
            closestPt = {
              x: S.x + t * D.x,
              y: S.y + t * D.y,
            };
            closestObstacle = seg;
          }
        }
      }
      return minT !== null && closestPt && closestObstacle
        ? { t: Math.max(0, minT), pt: closestPt, obstacle: closestObstacle }
        : null;
    };

    const faces = [];
    const faceKeys = ['top', 'right', 'bottom', 'left'];
    for (let j = 0; j < 4; j++) {
      const p1 = corners[j];
      const p2 = corners[(j + 1) % 4];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const L = Math.sqrt(dx * dx + dy * dy);
      if (L < 1e-3) continue;

      const N = { x: dy / L, y: -dx / L };
      faces.push({
        key: faceKeys[j],
        p1,
        p2,
        dx,
        dy,
        L,
        N,
      });
    }

    const guides: React.ReactNode[] = [];

    for (const face of faces) {
      const { key, p1, dx, dy, L, N } = face;

      // Project all obstacle endpoints onto the face segment to get critical coordinates
      const uCoords: number[] = [0, 1];
      const project = (Q: Point) => {
        const vX = Q.x - p1.x;
        const vY = Q.y - p1.y;
        return (vX * dx + vY * dy) / (L * L);
      };

      for (const seg of obstacleSegments) {
        const u1 = project(seg.p1);
        const u2 = project(seg.p2);
        if (u1 >= 0 && u1 <= 1) uCoords.push(u1);
        if (u2 >= 0 && u2 <= 1) uCoords.push(u2);
      }

      // Sort and clean coordinates
      uCoords.sort((a, b) => a - b);
      const uniqueU: number[] = [];
      for (const u of uCoords) {
        if (uniqueU.length === 0 || u - uniqueU[uniqueU.length - 1] > 1e-4) {
          uniqueU.push(u);
        }
      }

      // Evaluate intervals
      interface IntervalHit {
        uStart: number;
        uEnd: number;
        t: number;
        pt: Point;
        hitPt: Point;
        obstacleId: string;
        obstacleType: 'wall' | 'object';
        name: string;
      }

      const hits: IntervalHit[] = [];

      for (let i = 0; i < uniqueU.length - 1; i++) {
        const uStart = uniqueU[i];
        const uEnd = uniqueU[i + 1];
        if (uEnd - uStart < 1e-4) continue;

        const uMid = (uStart + uEnd) / 2;
        const SMid = {
          x: p1.x + uMid * dx,
          y: p1.y + uMid * dy,
        };

        const hit = getClosestIntersection(SMid, N);
        if (hit) {
          hits.push({
            uStart,
            uEnd,
            t: hit.t,
            pt: SMid,
            hitPt: hit.pt,
            obstacleId: hit.obstacle.id,
            obstacleType: hit.obstacle.type,
            name: hit.obstacle.name,
          });
        }
      }

      // Group adjacent intervals hitting the same obstacle
      const groupedHits: {
        uStart: number;
        uEnd: number;
        obstacleId: string;
        obstacleType: 'wall' | 'object';
        name: string;
      }[] = [];

      for (const h of hits) {
        const lastGroup = groupedHits[groupedHits.length - 1];
        if (lastGroup && lastGroup.obstacleId === h.obstacleId) {
          lastGroup.uEnd = h.uEnd;
        } else {
          groupedHits.push({
            uStart: h.uStart,
            uEnd: h.uEnd,
            obstacleId: h.obstacleId,
            obstacleType: h.obstacleType,
            name: h.name,
          });
        }
      }

      // Draw guides for each group
      for (const group of groupedHits) {
        const uMid = (group.uStart + group.uEnd) / 2;
        const S = { x: p1.x + uMid * dx, y: p1.y + uMid * dy };
        const hit = getClosestIntersection(S, N);

        if (hit && hit.t > 1) {
          const { t, pt } = hit;
          const midX = (S.x + pt.x) / 2;
          const midY = (S.y + pt.y) / 2;

          guides.push(
            <g key={`${key}-${group.obstacleId}-${group.uStart.toFixed(3)}-guide`}>
              <line
                x1={S.x}
                y1={S.y}
                x2={pt.x}
                y2={pt.y}
                stroke="var(--color-secondary)"
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              <foreignObject
                x={midX - 25}
                y={midY - 9}
                width="50"
                height="18"
                style={{ overflow: 'visible' }}
              >
                <div
                  style={{
                    background: 'var(--bg-canvas)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '3px',
                    color: 'var(--color-secondary)',
                    fontSize: '9px',
                    fontWeight: 600,
                    textAlign: 'center',
                    lineHeight: '16px',
                    fontFamily: 'var(--font-heading)',
                    transform: `scale(${1 / Math.max(0.6, Math.min(renderScale, 2))})`,
                    transformOrigin: 'center',
                  }}
                >
                  {formatValue(t)}
                </div>
              </foreignObject>
            </g>
          );
        }
      }
    }

    return guides;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as SVGElement;
    let targetId: string | null = null;
    const objectEl = target.closest('.canvas-object');
    if (objectEl) {
      targetId = objectEl.getAttribute('data-id');
    }
    const coords = getCanvasCoords(e.clientX, e.clientY);
    onContextMenu(e.clientX, e.clientY, targetId, coords);
  };

  return (
    <div
      ref={wrapperRef}
      className="canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      style={{ cursor: spacePressed ? (dragState.type === 'pan' ? 'grabbing' : 'grab') : 'default' }}
    >
      <div className="canvas-wrapper-hitbox" style={{ position: 'absolute', inset: 0 }} />

      {/* SVG Canvas Board */}
      <svg
        className={`svg-canvas ${selectedId ? 'selected-element-active' : ''}`}
        width={roomW}
        height={roomH}
        style={{
          transform: `translate(${offsetX - (wrapperSize.width - roomW) / 2}px, ${offsetY - (wrapperSize.height - roomH) / 2}px)`,
        }}
      >
        {/* Render scaled and offset floor plan contents */}
        <g transform={`scale(${renderScale}) translate(${-minX}, ${-minY})`}>
          
          {/* Room floor outline fill */}
          <polygon
            className="canvas-bg-hitbox"
            points={vertices.map((v) => `${v.x},${v.y}`).join(' ')}
            fill="rgba(12, 16, 28, 0.85)"
            stroke="none"
          />

          {/* Grid line overlay */}
          {renderGridLines()}

          {/* Room perimeter polygon dashed backdrop border */}
          <polygon
            points={vertices.map((v) => `${v.x},${v.y}`).join(' ')}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={4 / renderScale}
            strokeDasharray={`${6 / renderScale} ${4 / renderScale}`}
          />

          {/* Object distance helper lines */}
          {renderDistanceGuides()}

          {/* Solid room wall segments perimeters */}
          {vertices.map((v, i) => {
            const nextV = vertices[(i + 1) % vertices.length];
            return (
              <line
                key={`wall-${i}`}
                x1={v.x}
                y1={v.y}
                x2={nextV.x}
                y2={nextV.y}
                stroke="#6366f1"
                strokeWidth={3 / renderScale}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Objects layer */}
          {objects
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((obj) => {
              const isSelected = obj.id === selectedId;
              const isPartiallySelected = selectedIds.includes(obj.id);
              const w = obj.width;
              const h = obj.height;

              return (
                <g
                  key={obj.id}
                  data-id={obj.id}
                  transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation}, ${w / 2}, ${h / 2})`}
                  className={`canvas-object ${isPartiallySelected ? 'selected' : ''}`}
                  onMouseDown={(e) => handleObjMouseDown(e, obj)}
                >
                  {/* Visual CAD Blueprint */}
                  <FurnitureSymbol
                    type={obj.type}
                    width={w}
                    height={h}
                    color={obj.color}
                    text={obj.text}
                  />

                  {/* Selection Highlight (drawn on all selected objects) */}
                  {isPartiallySelected && !isSelected && (
                    <rect
                      x={-2 / renderScale}
                      y={-2 / renderScale}
                      width={w + 4 / renderScale}
                      height={h + 4 / renderScale}
                      stroke="var(--color-secondary)"
                      strokeWidth={1.5 / renderScale}
                      strokeDasharray={`${3 / renderScale} ${3 / renderScale}`}
                      fill="rgba(56, 189, 248, 0.08)"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}

                  {/* Inner text tags (except text notes which handle text directly) */}
                  {obj.type !== 'text' && (
                    <text
                      x={w / 2}
                      y={h / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#f3f4f6"
                      fontSize={Math.max(8 / renderScale, Math.min(11 / renderScale, w * 0.12))}
                      fontWeight="500"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                      transform={`scale(${1})`}
                    >
                      {obj.name}
                    </text>
                  )}

                  {/* Transformation selection handles */}
                  {isSelected && (
                    <g>
                      {/* Selection Box border */}
                      <rect
                        x={-2 / renderScale}
                        y={-2 / renderScale}
                        width={w + 4 / renderScale}
                        height={h + 4 / renderScale}
                        stroke="var(--border-focus)"
                        strokeWidth={1.5 / renderScale}
                        strokeDasharray={`${4 / renderScale} ${2 / renderScale}`}
                        fill="none"
                        style={{ pointerEvents: 'none' }}
                      />

                      {/* Display Width / Depth directly on element */}
                      <g style={{ pointerEvents: 'none' }}>
                        {/* Width Text */}
                        <text
                          x={w / 2}
                          y={h + 14 / renderScale}
                          fill="var(--border-focus)"
                          fontSize={9 / renderScale}
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="var(--font-heading)"
                        >
                          {formatValue(w)}
                        </text>
                        {/* Height/Depth Text */}
                        <text
                          x={w + 14 / renderScale}
                          y={h / 2}
                          fill="var(--border-focus)"
                          fontSize={9 / renderScale}
                          fontWeight="700"
                          textAnchor="start"
                          dominantBaseline="central"
                          fontFamily="var(--font-heading)"
                        >
                          {formatValue(h)}
                        </text>
                      </g>

                      {/* Corner scale handle node */}
                      <circle
                        cx={w}
                        cy={h}
                        r={6 / renderScale}
                        fill="#fff"
                        stroke="var(--border-focus)"
                        strokeWidth={2 / renderScale}
                        style={{ cursor: 'nwse-resize' }}
                        onMouseDown={(e) => handleResizeMouseDown(e, obj)}
                      />

                      {/* Top rotate handle stem & node */}
                      <line
                        x1={w / 2}
                        y1={0}
                        x2={w / 2}
                        y2={-20 / renderScale}
                        stroke="var(--border-focus)"
                        strokeWidth={1.5 / renderScale}
                        strokeDasharray={`${2 / renderScale} ${2 / renderScale}`}
                        style={{ pointerEvents: 'none' }}
                      />
                      <circle
                        cx={w / 2}
                        cy={-20 / renderScale}
                        r={5 / renderScale}
                        fill="var(--border-focus)"
                        stroke="var(--border-focus)"
                        strokeWidth={2 / renderScale}
                        className="rotate-handle"
                        onMouseDown={(e) => handleRotateMouseDown(e, obj)}
                      />
                    </g>
                  )}
                </g>
              );
            })}

          {/* Wall length labels & Midpoint split (+) buttons */}
          {vertices.map((v, i) => {
            const nextV = vertices[(i + 1) % vertices.length];
            const dx = nextV.x - v.x;
            const dy = nextV.y - v.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            
            // Midpoint coordinates
            const mx = (v.x + nextV.x) / 2;
            const my = (v.y + nextV.y) / 2;

            // Angle of wall
            const angle = Math.atan2(dy, dx);
            let textAngle = (angle * 180) / Math.PI;
            // Prevent text from going upside down
            if (textAngle > 90 || textAngle < -90) {
              textAngle += 180;
            }

            // Normal perpendicular vector to offset text outside
            const nx = -dy / len;
            const ny = dx / len;
            const offsetDist = 18 / renderScale;
            const tx = mx + nx * offsetDist;
            const ty = my + ny * offsetDist;

            return (
              <g key={`wall-labels-${i}`} style={{ pointerEvents: 'none' }}>
                {/* Wall size indicator text badge */}
                <text
                  x={tx}
                  y={ty}
                  fill="#a1a1aa"
                  fontSize={10 / renderScale}
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="var(--font-heading)"
                  transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                >
                  {formatValue(len)}
                </text>

                {/* Wall split (+) hover button (interactive overlay) */}
                <g
                  className="editor-split-handle"
                  transform={`translate(${mx}, ${my})`}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onMouseDown={(e) => handleSplitWall(e, i)}
                >
                  <title>Dividir pared (añadir esquina)</title>
                  <circle
                    r={8 / renderScale}
                    fill="var(--bg-card)"
                    stroke="var(--color-secondary)"
                    strokeWidth={1.5 / renderScale}
                  />
                  <line
                    x1={-4 / renderScale}
                    y1={0}
                    x2={4 / renderScale}
                    y2={0}
                    stroke="var(--color-secondary)"
                    strokeWidth={1.5 / renderScale}
                  />
                  <line
                    x1={0}
                    y1={-4 / renderScale}
                    x2={0}
                    y2={4 / renderScale}
                    stroke="var(--color-secondary)"
                    strokeWidth={1.5 / renderScale}
                  />
                </g>
              </g>
            );
          })}

          {/* Room corner handle nodes */}
          {vertices.map((v, i) => (
            <circle
              key={`vertex-${i}`}
              className="editor-corner-handle"
              cx={v.x}
              cy={v.y}
              r={7 / renderScale}
              fill="#fff"
              stroke="var(--color-primary)"
              strokeWidth={3 / renderScale}
              style={{ cursor: 'move', pointerEvents: 'auto' }}
              onMouseDown={(e) => handleVertexMouseDown(e, i)}
              onDoubleClick={() => handleVertexDoubleClick(i)}
            >
              <title>Doble click para eliminar esta esquina</title>
            </circle>
          ))}

          {/* Box selection indicator overlay */}
          {dragState.type === 'select-box' && (
            <rect
              x={Math.min(dragState.startCanvasX || 0, dragState.currentCanvasX || 0)}
              y={Math.min(dragState.startCanvasY || 0, dragState.currentCanvasY || 0)}
              width={Math.abs((dragState.currentCanvasX || 0) - (dragState.startCanvasX || 0))}
              height={Math.abs((dragState.currentCanvasY || 0) - (dragState.startCanvasY || 0))}
              fill="rgba(99, 102, 241, 0.06)"
              stroke="var(--color-primary)"
              strokeWidth={1.5 / renderScale}
              strokeDasharray={`${4 / renderScale} ${2 / renderScale}`}
            />
          )}

        </g>
      </svg>

      {/* Floating Canvas controls tooltips */}
      <div className="canvas-tooltip">
        <span>Esquinas Blancas</span> para ajustar paredes • <span>Botones (+)</span> para añadir esquinas • <span>Doble click esquina</span> para eliminarla
      </div>

      {/* Floating Keyboard Shortcuts Guide Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShowShortcuts();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="floating-shortcuts-btn"
        title="Ver Atajos de Teclado (Ctrl+/)"
      >
        <Keyboard size={14} style={{ marginRight: '6px' }} />
        <span>Atajos: <code>Ctrl + /</code></span>
      </button>
    </div>
  );
};
