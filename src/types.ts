export type Unit = 'cm' | 'm' | 'in' | 'ft';

export interface Point {
  x: number;
  y: number;
}

export interface RoomSettings {
  vertices: Point[]; // Array of points defining the room boundary in cm
  unit: Unit;
}

export type ObjectType =
  | 'bed'
  | 'nightstand'
  | 'dresser'
  | 'stairs'
  | 'box'
  | 'door'
  | 'window'
  | 'text'
  | 'sofa'
  | 'table'
  | 'chair'
  | 'wardrobe';

export interface RoomObject {
  id: string;
  type: ObjectType;
  name: string;
  x: number;      // in cm (relative to room top-left)
  y: number;      // in cm (relative to room top-left)
  width: number;  // in cm
  height: number; // in cm (represents 2D depth)
  rotation: number; // in degrees (0 to 359)
  color: string;
  text?: string;   // optional text for labels
  zIndex: number;
}

export interface EditorState {
  roomSettings: RoomSettings;
  objects: RoomObject[];
}

export interface GridSettings {
  showGrid: boolean;
  snapToGrid: boolean;
  snapSize: number; // in cm (e.g. 5, 10, 20)
}
