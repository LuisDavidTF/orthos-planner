import type { RoomObject, RoomSettings, Point } from '../types';
import {
  getObjectCorners,
  polygonsOverlap,
  isObjectFullyInRoom,
  getInsideWallNormal,
  getDistancePointToSegment
} from './layoutMath';

export interface DiagnosticItem {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  text: string;
}

export interface OptimizationScores {
  circulation: number;   // 0 to 100
  lighting: number;      // 0 to 100
  distribution: number;  // 0 to 100
  overall: number;       // 0 to 100
}

/**
 * Returns a world polygon representing a local clearance zone for an object.
 */
export const getClearanceZone = (
  obj: RoomObject,
  x1: number,
  x2: number,
  y1: number,
  y2: number
): Point[] => {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const theta = (obj.rotation * Math.PI) / 180;
  
  const localCorners = [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ];
  
  return localCorners.map((pt) => ({
    x: cx + pt.x * Math.cos(theta) - pt.y * Math.sin(theta),
    y: cy + pt.x * Math.sin(theta) + pt.y * Math.cos(theta),
  }));
};

/**
 * Computes specific clearance zones based on object type.
 */
export const getObjectSpecificClearance = (obj: RoomObject): { name: string; polygon: Point[] }[] => {
  const zones: { name: string; polygon: Point[] }[] = [];
  const w = obj.width;
  const h = obj.height;

  switch (obj.type) {
    case 'door':
      // Door path clearance: 100cm inside room in front of door (local +y direction)
      zones.push({
        name: 'Paso de Puerta',
        polygon: getClearanceZone(obj, -w/2, w/2, h/2, h/2 + 100),
      });
      break;
      
    case 'stairs':
      // Clearance at both ends: 80cm top and bottom
      zones.push({
        name: 'Acceso Escalera (Inicio)',
        polygon: getClearanceZone(obj, -w/2, w/2, -h/2 - 80, -h/2),
      });
      zones.push({
        name: 'Acceso Escalera (Fin)',
        polygon: getClearanceZone(obj, -w/2, w/2, h/2, h/2 + 80),
      });
      break;

    case 'wardrobe':
    case 'dresser':
      // Opening clearance: 60cm in front of it (local +y direction)
      zones.push({
        name: 'Apertura de Cajones/Puertas',
        polygon: getClearanceZone(obj, -w/2, w/2, h/2, h/2 + 60),
      });
      break;

    case 'bed':
      // Bed sides and foot: 50cm on left, right and bottom.
      // We start side corridors 60cm down from the headboard (-h/2 + 60)
      // to accommodate nightstands without penalizing walk-space.
      zones.push({
        name: 'Pasillo Izquierdo de Cama',
        polygon: getClearanceZone(obj, -w/2 - 50, -w/2, -h/2 + 60, h/2),
      });
      zones.push({
        name: 'Pasillo Derecho de Cama',
        polygon: getClearanceZone(obj, w/2, w/2 + 50, -h/2 + 60, h/2),
      });
      zones.push({
        name: 'Pasillo al Pie de Cama',
        polygon: getClearanceZone(obj, -w/2, w/2, h/2, h/2 + 50),
      });
      break;
      
    case 'window':
      // Natural light ray: extends 200cm inside (local +y direction)
      zones.push({
        name: 'Haz de Luz Natural',
        polygon: getClearanceZone(obj, -w/2, w/2, h/2, h/2 + 200),
      });
      break;
  }

  return zones;
};

/**
 * Evaluates the layout and calculates dynamic scores and diagnostics.
 */
export const evaluateLayout = (
  objects: RoomObject[],
  roomSettings: RoomSettings,
  _orientation: 'N' | 'S' | 'E' | 'W'
): { scores: OptimizationScores; diagnostics: DiagnosticItem[] } => {
  const vertices = roomSettings.vertices || [];
  const diagnostics: DiagnosticItem[] = [];

  let circulationPenalty = 0;
  let lightingPenalty = 0;
  let distributionPenalty = 0;
  let lightingBonus = 0;
  let distributionBonus = 0;

  // Track occurrences of successes for checklist
  let doorsClearCount = 0;
  let doorsTotalCount = 0;
  let stairsClearCount = 0;
  let stairsTotalCount = 0;
  let bedsClearCount = 0;
  let bedsTotalCount = 0;
  let wardrobesClearCount = 0;
  let wardrobesTotalCount = 0;
  let desksWellLit = 0;
  let desksTotal = 0;
  let windowTallBlocks = 0;
  let wallAlignedCount = 0;
  let wallAlignedTotal = 0;
  let nightstandsCloseCount = 0;
  let nightstandsTotal = 0;

  const overlapPairs = new Set<string>();
  const outOfRoomCount = new Set<string>();

  // 1. Basic Collisions (Overlap & Room Containment)
  for (let i = 0; i < objects.length; i++) {
    const o1 = objects[i];
    const corners1 = getObjectCorners(o1);
    
    // Check Room Bounds
    if (vertices.length >= 3 && !isObjectFullyInRoom(o1, vertices)) {
      distributionPenalty += 250;
      outOfRoomCount.add(o1.id);
    }

    // Check Overlaps
    for (let j = i + 1; j < objects.length; j++) {
      const o2 = objects[j];
      
      // Let chairs and desks overlap slightly (tucked in)
      if (
        (o1.type === 'chair' && o2.type === 'table') ||
        (o1.type === 'table' && o2.type === 'chair')
      ) {
        // Allow up to 30% overlap area
        const corners2 = getObjectCorners(o2);
        if (polygonsOverlap(corners1, corners2)) {
          // Check if distance between centers is small
          const c1x = o1.x + o1.width/2;
          const c1y = o1.y + o1.height/2;
          const c2x = o2.x + o2.width/2;
          const c2y = o2.y + o2.height/2;
          const dist = Math.sqrt(Math.pow(c1x - c2x, 2) + Math.pow(c1y - c2y, 2));
          if (dist < 15) {
            distributionPenalty += 80;
            overlapPairs.add(`${o1.id}-${o2.id}`);
          }
        }
        continue;
      }

      // Default overlap check
      const corners2 = getObjectCorners(o2);
      if (polygonsOverlap(corners1, corners2)) {
        distributionPenalty += 400;
        overlapPairs.add(`${o1.id}-${o2.id}`);
      }
    }
  }

  // Diagnostics for overlaps & bounds
  if (outOfRoomCount.size > 0) {
    diagnostics.push({
      id: 'diag-out-room',
      type: 'error',
      text: `Hay ${outOfRoomCount.size} mueble(s) fuera del límite de los muros de la habitación.`,
    });
  }
  if (overlapPairs.size > 0) {
    diagnostics.push({
      id: 'diag-overlap',
      type: 'error',
      text: `Colisión detectable: ${overlapPairs.size} par(es) de muebles se superponen entre sí.`,
    });
  }

  // 2. Clearance Obstructions (Circulation)
  const movableObjects = objects.filter((o) => o.type !== 'door' && o.type !== 'window' && o.type !== 'stairs');

  objects.forEach((obj) => {
    if (obj.type === 'door') {
      doorsTotalCount++;
      const doorZone = getObjectSpecificClearance(obj)[0]?.polygon;
      let blocked = false;
      if (doorZone) {
        for (const other of movableObjects) {
          if (polygonsOverlap(doorZone, getObjectCorners(other))) {
            blocked = true;
            circulationPenalty += 350;
            diagnostics.push({
              id: `diag-block-door-${obj.id}-${other.id}`,
              type: 'error',
              text: `El mueble "${other.name}" está bloqueando la entrada de la "${obj.name}".`,
            });
          }
        }
      }
      if (!blocked) doorsClearCount++;
    }

    else if (obj.type === 'stairs') {
      stairsTotalCount++;
      const stairClearances = getObjectSpecificClearance(obj);
      let blocked = false;
      stairClearances.forEach((stairZone) => {
        for (const other of movableObjects) {
          if (polygonsOverlap(stairZone.polygon, getObjectCorners(other))) {
            blocked = true;
            circulationPenalty += 250;
            diagnostics.push({
              id: `diag-block-stair-${obj.id}-${other.id}`,
              type: 'error',
              text: `"${other.name}" obstruye los pasillos de acceso a la "${obj.name}".`,
            });
          }
        }
      });
      if (!blocked) stairsClearCount++;
    }

    else if (obj.type === 'wardrobe' || obj.type === 'dresser') {
      wardrobesTotalCount++;
      const frontZone = getObjectSpecificClearance(obj)[0]?.polygon;
      let blocked = false;
      if (frontZone) {
        for (const other of movableObjects) {
          if (other.id === obj.id) continue;
          if (polygonsOverlap(frontZone, getObjectCorners(other))) {
            blocked = true;
            circulationPenalty += 150;
            diagnostics.push({
              id: `diag-block-wardrobe-${obj.id}-${other.id}`,
              type: 'warning',
              text: `No hay suficiente espacio libre frente a "${obj.name}" debido a "${other.name}".`,
            });
          }
        }
      }
      if (!blocked) wardrobesClearCount++;
    }

    else if (obj.type === 'bed') {
      bedsTotalCount++;
      const bedClearances = getObjectSpecificClearance(obj); // Left, Right, Foot
      const isSingle = obj.width <= 100;
      
      let leftBlocked = false;
      let rightBlocked = false;
      let footBlocked = false;

      for (const other of movableObjects) {
        if (other.id === obj.id) continue;
        const otherCorners = getObjectCorners(other);

        if (polygonsOverlap(bedClearances[0].polygon, otherCorners)) leftBlocked = true;
        if (polygonsOverlap(bedClearances[1].polygon, otherCorners)) rightBlocked = true;
        if (polygonsOverlap(bedClearances[2].polygon, otherCorners)) footBlocked = true;
      }

      let bedError = false;
      if (isSingle) {
        // Single beds can have one side against a wall, but both sides blocked is bad
        if (leftBlocked && rightBlocked) {
          circulationPenalty += 150;
          bedError = true;
          diagnostics.push({
            id: `diag-block-bed-sides-${obj.id}`,
            type: 'warning',
            text: `La cama individual "${obj.name}" está encajonada (ambos lados obstruidos).`,
          });
        }
      } else {
        // Double beds need both sides clear
        if (leftBlocked || rightBlocked) {
          circulationPenalty += 120;
          bedError = true;
          diagnostics.push({
            id: `diag-block-bed-side-${obj.id}`,
            type: 'warning',
            text: `La cama doble "${obj.name}" requiere pasillo libre a ambos lados.`,
          });
        }
      }

      if (footBlocked) {
        circulationPenalty += 100;
        bedError = true;
        diagnostics.push({
          id: `diag-block-bed-foot-${obj.id}`,
          type: 'warning',
          text: `El acceso al pie de la cama "${obj.name}" está obstruido.`,
        });
      }

      if (!bedError) bedsClearCount++;
    }
  });

  // Checklist item for circulation
  if (doorsTotalCount > 0 && doorsClearCount === doorsTotalCount && stairsClearCount === stairsTotalCount) {
    diagnostics.push({
      id: 'check-circulation-ok',
      type: 'success',
      text: 'Pasillos y accesos principales (puertas/escaleras) completamente despejados.',
    });
  }

  // 3. Lighting & Windows
  objects.forEach((obj) => {
    if (obj.type === 'window') {
      const windowZone = getObjectSpecificClearance(obj)[0]?.polygon;
      if (windowZone) {
        for (const other of movableObjects) {
          // Check if tall object blocks window within first 60cm of window zone
          const isTall = other.type === 'wardrobe' || other.type === 'stairs' || other.type === 'dresser';
          if (isTall) {
            const overlap = polygonsOverlap(windowZone, getObjectCorners(other));
            if (overlap) {
              // Check distance to window
              const winCenter = { x: obj.x + obj.width/2, y: obj.y + obj.height/2 };
              const otherCenter = { x: other.x + other.width/2, y: other.y + other.height/2 };
              const dist = Math.sqrt(Math.pow(winCenter.x - otherCenter.x, 2) + Math.pow(winCenter.y - otherCenter.y, 2));
              if (dist < 100) {
                lightingPenalty += 200;
                windowTallBlocks++;
                diagnostics.push({
                  id: `diag-block-window-${obj.id}-${other.id}`,
                  type: 'warning',
                  text: `"${other.name}" (objeto alto) está tapando la "${obj.name}" restando luz natural.`,
                });
              }
            }
          }
        }
      }
    }

    else if (obj.type === 'table') {
      desksTotal++;
      let isLit = false;
      
      // Find windows
      objects.filter((w) => w.type === 'window').forEach((win) => {
        const windowZone = getObjectSpecificClearance(win)[0]?.polygon;
        if (windowZone && polygonsOverlap(windowZone, getObjectCorners(obj))) {
          isLit = true;
        }
      });

      if (isLit) {
        lightingBonus += 100;
        desksWellLit++;
      } else {
        // Encourage desks near windows
        lightingPenalty += 50;
      }
    }
  });

  if (desksTotal > 0 && desksWellLit > 0) {
    diagnostics.push({
      id: 'check-desks-light',
      type: 'success',
      text: `Excelente luz natural en escritorio (${desksWellLit}/${desksTotal} mesas cerca de ventanas).`,
    });
  }

  if (windowTallBlocks === 0 && objects.some((o) => o.type === 'window')) {
    diagnostics.push({
      id: 'check-windows-clear',
      type: 'success',
      text: 'Todas las ventanas se mantienen libres de muebles altos.',
    });
  }

  // 4. Distribution (Alineación a Muro, Burós, Cajas)
  const wallAlignedTypes: RoomObject['type'][] = ['bed', 'wardrobe', 'dresser', 'sofa', 'table'];
  
  objects.forEach((obj) => {
    if (wallAlignedTypes.includes(obj.type)) {
      wallAlignedTotal++;
      let aligned = false;
      const corners = getObjectCorners(obj);
      
      // Identify back corners. For simplicity, we assume back is top edge (indices 0 and 1 of corners)
      const p1 = corners[0];
      const p2 = corners[1];
      
      // Check distance to room walls
      for (let i = 0; i < vertices.length; i++) {
        const w1 = vertices[i];
        const w2 = vertices[(i + 1) % vertices.length];
        
        const d1 = getDistancePointToSegment(p1, w1, w2);
        const d2 = getDistancePointToSegment(p2, w1, w2);
        
        // Aligned if both points are within 12cm of the wall segment
        if (d1 < 12 && d2 < 12) {
          aligned = true;
          
          // Bed specific checks: Headboard should not be on a wall with windows or doors
          if (obj.type === 'bed') {
            const openings = objects.filter(o => o.type === 'door' || o.type === 'window');
            let hasOpening = false;
            let openingName = '';
            for (const op of openings) {
              const opCenter = { x: op.x + op.width/2, y: op.y + op.height/2 };
              const dOp = getDistancePointToSegment(opCenter, w1, w2);
              if (dOp < 30) {
                hasOpening = true;
                openingName = op.name;
                break;
              }
            }
            if (hasOpening) {
              distributionPenalty += 250; // Heavy penalty for placing headboard on wall with window/door
              diagnostics.push({
                id: `diag-bed-headboard-opening-${obj.id}`,
                type: 'warning',
                text: `La cabecera de la cama "${obj.name}" está apoyada sobre una pared con una abertura ("${openingName}").`,
              });
            }
          }

          // Dresser / Wardrobe specific checks: Should not block windows along the walls
          if (obj.type === 'dresser' || obj.type === 'wardrobe') {
            const windows = objects.filter(o => o.type === 'window');
            let blocksWindow = false;
            let windowName = '';
            for (const win of windows) {
              const winCenter = { x: win.x + win.width/2, y: win.y + win.height/2 };
              const dWin = getDistancePointToSegment(winCenter, w1, w2);
              if (dWin < 30) {
                // The window is on this wall. Check distance between object center and window center.
                const objCenter = { x: obj.x + obj.width/2, y: obj.y + obj.height/2 };
                const distToWin = Math.sqrt(Math.pow(objCenter.x - winCenter.x, 2) + Math.pow(objCenter.y - winCenter.y, 2));
                if (distToWin < (obj.width/2 + win.width/2 + 25)) { // overlap along the wall (with 25cm buffer)
                  blocksWindow = true;
                  windowName = win.name;
                  break;
                }
              }
            }
            if (blocksWindow) {
              distributionPenalty += 200; // Penalty for blocking window along the wall
              diagnostics.push({
                id: `diag-tall-block-window-wall-${obj.id}`,
                type: 'warning',
                text: `El mueble alto "${obj.name}" está tapando la ventana "${windowName}".`,
              });
            }
          }
          break;
        }
      }

      if (aligned) {
        distributionBonus += 80;
        wallAlignedCount++;
      } else {
        distributionPenalty += 60;
      }
    }

    else if (obj.type === 'nightstand') {
      nightstandsTotal++;
      // Check if nightstand is close to a bed headboard (corners 0 or 1 of bed)
      let closeToBed = false;
      const nsCenter = { x: obj.x + obj.width/2, y: obj.y + obj.height/2 };
      
      objects.filter((o) => o.type === 'bed').forEach((bed) => {
        const bedCorners = getObjectCorners(bed);
        // Headboard corners
        const hc1 = bedCorners[0];
        const hc2 = bedCorners[1];
        
        const dist1 = Math.sqrt(Math.pow(nsCenter.x - hc1.x, 2) + Math.pow(nsCenter.y - hc1.y, 2));
        const dist2 = Math.sqrt(Math.pow(nsCenter.x - hc2.x, 2) + Math.pow(nsCenter.y - hc2.y, 2));
        
        if (dist1 < 85 || dist2 < 85) {
          closeToBed = true;
        }
      });

      if (closeToBed) {
        distributionBonus += 100;
        nightstandsCloseCount++;
      } else {
        distributionPenalty += 40;
      }
    }
  });

  // Diagnostic for wall alignment
  if (wallAlignedTotal > 0 && wallAlignedCount === wallAlignedTotal) {
    diagnostics.push({
      id: 'check-alignment-ok',
      type: 'success',
      text: 'Distribución eficiente: Muebles principales instalados al ras de los muros.',
    });
  } else if (wallAlignedTotal > 0 && wallAlignedCount < wallAlignedTotal) {
    diagnostics.push({
      id: 'diag-alignment-warn',
      type: 'info',
      text: `Optimización espacial: ${wallAlignedTotal - wallAlignedCount} mueble(s) podrían pegarse más a la pared para ahorrar espacio.`,
    });
  }

  if (nightstandsTotal > 0 && nightstandsCloseCount === nightstandsTotal) {
    diagnostics.push({
      id: 'check-nightstands-ok',
      type: 'success',
      text: 'Los burós están ubicados adecuadamente al lado de la cabecera de las camas.',
    });
  }

  // 5. Boxes Clustering
  const boxes = objects.filter((o) => o.type === 'box');
  if (boxes.length > 1) {
    let clustered = true;
    for (let i = 0; i < boxes.length; i++) {
      let hasNeighbor = false;
      const b1 = boxes[i];
      for (let j = 0; j < boxes.length; j++) {
        if (i === j) continue;
        const b2 = boxes[j];
        const dist = Math.sqrt(Math.pow(b1.x - b2.x, 2) + Math.pow(b1.y - b2.y, 2));
        if (dist < 100) hasNeighbor = true;
      }
      if (!hasNeighbor) clustered = false;
    }
    if (clustered) {
      distributionBonus += 100;
      diagnostics.push({
        id: 'check-boxes-clustered',
        type: 'success',
        text: 'Cajas de mudanza agrupadas en un sector secundario ordenadamente.',
      });
    } else {
      distributionPenalty += 60;
      diagnostics.push({
        id: 'diag-boxes-dispersed',
        type: 'info',
        text: 'Las cajas de mudanza están dispersas. Se recomienda agruparlas en un rincón.',
      });
    }
  }

  // 6. Calculate Final Scores (Scale to 0-100)
  // Circulation Score
  const circulationScore = Math.max(0, Math.min(100, Math.round(100 - circulationPenalty)));
  
  // Lighting Score
  const baseLight = 100;
  const lightingScore = Math.max(0, Math.min(100, Math.round(baseLight - lightingPenalty + lightingBonus)));
  
  // Distribution Score
  const distributionScore = Math.max(0, Math.min(100, Math.round(100 - distributionPenalty + distributionBonus)));

  // Weighted Overall Score
  const overallScore = Math.round(
    circulationScore * 0.4 +
    lightingScore * 0.3 +
    distributionScore * 0.3
  );

  return {
    scores: {
      circulation: circulationScore,
      lighting: lightingScore,
      distribution: distributionScore,
      overall: overallScore,
    },
    diagnostics,
  };
};

/**
 * Optimizes the layout of room objects using Simulated Annealing.
 */
export const optimizeLayout = (
  initialObjects: RoomObject[],
  roomSettings: RoomSettings,
  profile: 'space' | 'sleep' | 'work',
  orientation: 'N' | 'S' | 'E' | 'W'
): RoomObject[] => {
  const vertices = roomSettings.vertices || [];
  if (vertices.length < 3) return initialObjects;

  // Clone objects
  let currentObjects = JSON.parse(JSON.stringify(initialObjects)) as RoomObject[];
  
  // Fixed anchors: doors, windows, stairs. These cannot be moved by layout optimizer.
  const fixedTypes = ['door', 'window', 'stairs'];
  
  const minX = Math.min(...vertices.map(v => v.x));
  const maxX = Math.max(...vertices.map(v => v.x));
  const minY = Math.min(...vertices.map(v => v.y));
  const maxY = Math.max(...vertices.map(v => v.y));

  // Determine if room has only orthogonal wall segments
  const isOrthogonalRoom = vertices.every((v, idx) => {
    const nextV = vertices[(idx + 1) % vertices.length];
    const dx = Math.abs(nextV.x - v.x);
    const dy = Math.abs(nextV.y - v.y);
    return dx < 1e-2 || dy < 1e-2;
  });

  // Helper to evaluate just score
  const getScore = (objs: RoomObject[]) => {
    const { scores } = evaluateLayout(objs, roomSettings, orientation);
    
    // Add massive penalties for hard constraint violations to guarantee validity in final layouts
    let hardConstraintPenalty = 0;
    
    // 1. Penalty for objects being out of the room polygon
    objs.forEach((o) => {
      if (fixedTypes.includes(o.type)) return; // Skip fixed architectural elements
      if (vertices.length >= 3 && !isObjectFullyInRoom(o, vertices)) {
        hardConstraintPenalty += 8000; // Large penalty per out-of-room object
      }
    });

    // 2. Penalty for overlapping objects
    for (let i = 0; i < objs.length; i++) {
      const o1 = objs[i];
      const corners1 = getObjectCorners(o1);
      for (let j = i + 1; j < objs.length; j++) {
        const o2 = objs[j];
        
        // Allow chair-table tucking
        if (
          (o1.type === 'chair' && o2.type === 'table') ||
          (o1.type === 'table' && o2.type === 'chair')
        ) {
          const c1x = o1.x + o1.width/2;
          const c1y = o1.y + o1.height/2;
          const c2x = o2.x + o2.width/2;
          const c2y = o2.y + o2.height/2;
          const dist = Math.sqrt(Math.pow(c1x - c2x, 2) + Math.pow(c1y - c2y, 2));
          if (dist < 15) {
            hardConstraintPenalty += 3000;
          }
          continue;
        }

        if (polygonsOverlap(corners1, getObjectCorners(o2))) {
          hardConstraintPenalty += 5000; // Penalty per overlap pair
        }
      }
    }
    
    // Add specific profile weightings to the objective score function
    let profileAdjustment = 0;
    if (profile === 'space') {
      // In Space Maximizer, reward items being near the walls, leaving a massive open center polygon.
      // Penalize distance from walls for large items
      objs.forEach((o) => {
        if (['wardrobe', 'dresser', 'sofa', 'bed'].includes(o.type)) {
          const cx = o.x + o.width/2;
          const cy = o.y + o.height/2;
          
          let minDist = Infinity;
          for (let i = 0; i < vertices.length; i++) {
            const d = getDistancePointToSegment({ x: cx, y: cy }, vertices[i], vertices[(i+1)%vertices.length]);
            minDist = Math.min(minDist, d);
          }
          profileAdjustment -= minDist * 1.5; // Penalty for floating in the center
        }
        if (o.type === 'box') {
          // Boxes should cluster near corner points
          let minCornerDist = Infinity;
          vertices.forEach((v) => {
            const d = Math.sqrt(Math.pow(o.x - v.x, 2) + Math.pow(o.y - v.y, 2));
            minCornerDist = Math.min(minCornerDist, d);
          });
          profileAdjustment -= minCornerDist * 0.8;
        }
      });
    } 
    
    else if (profile === 'sleep') {
      // Sleep profile: prioritize bed comfort.
      objs.forEach((o) => {
        if (o.type === 'bed') {
          const bedCx = o.x + o.width/2;
          const bedCy = o.y + o.height/2;
          
          // Bed should be away from doors and stairs
          objs.forEach((other) => {
            if (other.type === 'door' || other.type === 'stairs') {
              const otherCx = other.x + other.width/2;
              const otherCy = other.y + other.height/2;
              const dist = Math.sqrt(Math.pow(bedCx - otherCx, 2) + Math.pow(bedCy - otherCy, 2));
              if (dist < 150) {
                profileAdjustment -= (150 - dist) * 2; // Penalty for being too close to entryways
              }
            }
          });
        }
      });
    }
    
    else if (profile === 'work') {
      // Work profile: desks near window light rays
      objs.forEach((o) => {
        if (o.type === 'table') {
          const deskCenter = { x: o.x + o.width/2, y: o.y + o.height/2 };
          
          // Reward proximity to windows
          objs.filter((w) => w.type === 'window').forEach((win) => {
            const winCenter = { x: win.x + win.width/2, y: win.y + win.height/2 };
            const dist = Math.sqrt(Math.pow(deskCenter.x - winCenter.x, 2) + Math.pow(deskCenter.y - winCenter.y, 2));
            if (dist < 180) {
              profileAdjustment += (180 - dist) * 3; // Bonus for being close to window
            }
          });
        }
      });
    }

    return scores.overall * 10 + profileAdjustment - hardConstraintPenalty;
  };

  let currentScore = getScore(currentObjects);
  let bestObjects = JSON.parse(JSON.stringify(currentObjects)) as RoomObject[];
  let bestScore = currentScore;

  // Optimization Parameters: Simulated Annealing
  let temp = 100.0;
  const coolingRate = 0.96;
  const iterationsPerTemp = 40;
  const minTemp = 0.5;

  const wallAlignmentTypes = ['bed', 'wardrobe', 'dresser', 'sofa', 'table'];

  while (temp > minTemp) {
    for (let iter = 0; iter < iterationsPerTemp; iter++) {
      // Select a random movable object
      const movableIndex = Math.floor(Math.random() * currentObjects.length);
      const obj = currentObjects[movableIndex];
      if (fixedTypes.includes(obj.type)) continue; // Skip doors, windows, stairs

      // Save previous state
      const oldX = obj.x;
      const oldY = obj.y;
      const oldRot = obj.rotation;

      // Propose a change
      const r = Math.random();
      
      if (r < 0.28 && wallAlignmentTypes.includes(obj.type)) {
        // Option 1: Align to a random wall segment
        const wallIdx = Math.floor(Math.random() * vertices.length);
        const w1 = vertices[wallIdx];
        const w2 = vertices[(wallIdx + 1) % vertices.length];
        
        const normal = getInsideWallNormal(w1, w2, vertices);
        
        // Set rotation to face inside
        const normalAngle = Math.atan2(normal.y, normal.x) * 180 / Math.PI;
        obj.rotation = Math.round((normalAngle - 90 + 360) % 360);
        
        // Place flush at random fraction along wall
        const wallLen = Math.sqrt(Math.pow(w2.x - w1.x, 2) + Math.pow(w2.y - w1.y, 2));
        const margin = Math.min(wallLen, obj.width) / 2;
        const distAlong = margin + Math.random() * Math.max(0, wallLen - 2 * margin);
        
        const wallUx = (w2.x - w1.x) / wallLen;
        const wallUy = (w2.y - w1.y) / wallLen;
        
        // Object center: C = w1 + distAlong * tangent + (height/2) * normal_inside
        const cx = w1.x + distAlong * wallUx + (obj.height / 2) * normal.x;
        const cy = w1.y + distAlong * wallUy + (obj.height / 2) * normal.y;
        
        obj.x = Math.round(cx - obj.width / 2);
        obj.y = Math.round(cy - obj.height / 2);
      } 
      
      else if (r < 0.40 && obj.type === 'nightstand') {
        // Option 2: Attach nightstand next to a bed
        const beds = currentObjects.filter((o) => o.type === 'bed');
        if (beds.length > 0) {
          const bed = beds[Math.floor(Math.random() * beds.length)];
          const side = Math.random() > 0.5 ? 'left' : 'right';
          
          // Match bed rotation
          obj.rotation = bed.rotation;
          const theta = (bed.rotation * Math.PI) / 180;
          
          // Shift left or right by half bed width + half nightstand width + 8cm gap
          const lx = (side === 'left' ? -1 : 1) * (bed.width / 2 + obj.width / 2 + 8);
          // Shift down so the top of the nightstand is aligned flush with the headboard (no wall crossing)
          const ly = -bed.height / 2 + obj.height / 2;
          
          const bedCx = bed.x + bed.width / 2;
          const bedCy = bed.y + bed.height / 2;
          
          // Coordinate transformation using rotation matrix
          const cx = bedCx + lx * Math.cos(theta) - ly * Math.sin(theta);
          const cy = bedCy + lx * Math.sin(theta) + ly * Math.cos(theta);
          
          obj.x = Math.round(cx - obj.width / 2);
          obj.y = Math.round(cy - obj.height / 2);
        } else {
          // Standard nudge
          obj.x += Math.round((Math.random() - 0.5) * 80);
          obj.y += Math.round((Math.random() - 0.5) * 80);
        }
      } 
      
      else if (r < 0.50 && obj.type === 'box') {
        // Option 3: Stack or group boxes
        const otherBoxes = currentObjects.filter((o) => o.type === 'box' && o.id !== obj.id);
        if (otherBoxes.length > 0) {
          const otherBox = otherBoxes[Math.floor(Math.random() * otherBoxes.length)];
          // Place adjacent to other box
          const offset = Math.random() > 0.5 ? obj.width + 5 : -(obj.width + 5);
          if (Math.random() > 0.5) {
            obj.x = otherBox.x + offset;
            obj.y = otherBox.y;
          } else {
            obj.x = otherBox.x;
            obj.y = otherBox.y + offset;
          }
          obj.rotation = otherBox.rotation;
        } else {
          // Put box in a random room corner
          const corner = vertices[Math.floor(Math.random() * vertices.length)];
          obj.x = corner.x + (Math.random() > 0.5 ? 10 : -obj.width - 10);
          obj.y = corner.y + (Math.random() > 0.5 ? 10 : -obj.height - 10);
        }
      } 
      
      else if (r < 0.75) {
        // Option 4: Simple random translation (nudge)
        obj.x += Math.round((Math.random() - 0.5) * 60);
        obj.y += Math.round((Math.random() - 0.5) * 60);
      } 
      
      else {
        // Option 5: Simple rotation
        obj.rotation = (obj.rotation + 90) % 360;
      }

      // Constrain to room bounding box limits roughly to keep search focused
      obj.x = Math.max(minX - 40, Math.min(maxX - obj.width + 40, obj.x));
      obj.y = Math.max(minY - 40, Math.min(maxY - obj.height + 40, obj.y));

      const newScore = getScore(currentObjects);
      const delta = newScore - currentScore;

      // Acceptance probability
      if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
        currentScore = newScore;
        
        // Check if this is the best valid layout found so far
        if (currentScore > bestScore) {
          // Verify no major wall crossings or overlaps for best layout
          const { scores } = evaluateLayout(currentObjects, roomSettings, orientation);
          if (scores.overall >= 40) { // must be somewhat reasonable
            bestScore = currentScore;
            bestObjects = JSON.parse(JSON.stringify(currentObjects));
          }
        }
      } else {
        // Revert change
        obj.x = oldX;
        obj.y = oldY;
        obj.rotation = oldRot;
      }
    }

    temp *= coolingRate;
  }

  // Snap finalized coordinates
  bestObjects.forEach((obj) => {
    if (fixedTypes.includes(obj.type)) return;
    
    if (isOrthogonalRoom) {
      obj.x = Math.round(obj.x / 5) * 5;
      obj.y = Math.round(obj.y / 5) * 5;
      obj.rotation = Math.round(obj.rotation / 90) * 90 % 360; // Clean 90 deg snaps for rectangular layouts
    } else {
      // Snapping to 1cm and 1deg to maintain precise fit along diagonal walls in irregular layouts
      obj.x = Math.round(obj.x);
      obj.y = Math.round(obj.y);
      obj.rotation = Math.round(obj.rotation) % 360;
    }
  });

  return bestObjects;
};
