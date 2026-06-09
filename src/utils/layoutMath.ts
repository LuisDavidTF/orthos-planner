import type { Point, RoomObject } from '../types';

/**
 * Calculates the 4 corner points of a rotated RoomObject in world coordinates.
 */
export const getObjectCorners = (obj: RoomObject): Point[] => {
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

/**
 * Determines if a point is inside a polygon using ray-casting.
 */
export const isPointInPolygon = (pt: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y))
      && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Solves line segment intersection between [a->b] and [c->d].
 */
export const lineSegmentsIntersect = (a: Point, b: Point, c: Point, d: Point): boolean => {
  const rx = b.x - a.x;
  const ry = b.y - a.y;
  const sx = d.x - c.x;
  const sy = d.y - c.y;

  const rxs = rx * sy - ry * sx;
  if (Math.abs(rxs) < 1e-8) return false; // Parallel or collinear

  const cminusax = c.x - a.x;
  const cminusay = c.y - a.y;

  const t = (cminusax * sy - cminusay * sx) / rxs;
  const u = (cminusax * ry - cminusay * rx) / rxs;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
};

/**
 * Checks if two arbitrary polygons overlap using Separating Axis Theorem (SAT).
 */
export const polygonsOverlap = (poly1: Point[], poly2: Point[]): boolean => {
  const polys = [poly1, poly2];
  for (let p = 0; p < 2; p++) {
    const poly = polys[p];
    for (let i = 0; i < poly.length; i++) {
      const next = (i + 1) % poly.length;
      
      // Edge vector
      const edgeX = poly[next].x - poly[i].x;
      const edgeY = poly[next].y - poly[i].y;
      
      // Normal vector (axis of projection)
      const axis = { x: -edgeY, y: edgeX };
      const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
      if (len === 0) continue;
      
      axis.x /= len;
      axis.y /= len;

      // Project poly1 onto axis
      let min1 = Infinity, max1 = -Infinity;
      for (let k = 0; k < poly1.length; k++) {
        const dot = poly1[k].x * axis.x + poly1[k].y * axis.y;
        min1 = Math.min(min1, dot);
        max1 = Math.max(max1, dot);
      }

      // Project poly2 onto axis
      let min2 = Infinity, max2 = -Infinity;
      for (let k = 0; k < poly2.length; k++) {
        const dot = poly2[k].x * axis.x + poly2[k].y * axis.y;
        min2 = Math.min(min2, dot);
        max2 = Math.max(max2, dot);
      }

      // Check gap
      if (max1 < min2 || max2 < min1) {
        return false; // Gap found, no overlap
      }
    }
  }
  return true; // No gaps, polygons overlap
};

/**
 * Checks if an object (its rotated rectangle representation) is fully inside the room boundary.
 */
export const isObjectFullyInRoom = (obj: RoomObject, roomVertices: Point[]): boolean => {
  if (roomVertices.length < 3) return true;
  
  const corners = getObjectCorners(obj);
  
  // 1. All corners must be inside the room polygon
  for (const pt of corners) {
    if (!isPointInPolygon(pt, roomVertices)) {
      return false;
    }
  }
  
  // 2. No edge of the object can intersect any wall segment
  for (let i = 0; i < corners.length; i++) {
    const c1 = corners[i];
    const c2 = corners[(i + 1) % corners.length];
    
    for (let j = 0; j < roomVertices.length; j++) {
      const w1 = roomVertices[j];
      const w2 = roomVertices[(j + 1) % roomVertices.length];
      
      if (lineSegmentsIntersect(c1, c2, w1, w2)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Computes the distance from a point to a line segment.
 */
export const getDistancePointToSegment = (pt: Point, p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.sqrt(Math.pow(pt.x - p1.x, 2) + Math.pow(pt.y - p1.y, 2));
  }
  
  // Projection factor t clamped to [0, 1]
  let t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  
  return Math.sqrt(Math.pow(pt.x - projX, 2) + Math.pow(pt.y - projY, 2));
};

/**
 * Finds the unit normal vector of a wall segment (v1 -> v2) that points inside the room polygon.
 */
export const getInsideWallNormal = (v1: Point, v2: Point, roomVertices: Point[]): Point => {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 1 };
  
  const ux = dx / len;
  const uy = dy / len;
  
  // Normal option 1 (+90 deg): (-uy, ux)
  // Normal option 2 (-90 deg): (uy, -ux)
  const n1 = { x: -uy, y: ux };
  const n2 = { x: uy, y: -ux };
  
  // Test midpoint displaced by 1cm along normals
  const mx = (v1.x + v2.x) / 2;
  const my = (v1.y + v2.y) / 2;
  
  const test1 = { x: mx + n1.x, y: my + n1.y };
  if (isPointInPolygon(test1, roomVertices)) {
    return n1;
  }
  return n2;
};
