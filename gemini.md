# Developer & Agent Guidelines: Room Simulator

This file preserves the development context, architectural design, coding patterns, styling tokens, and environment rules of the 2D Room Simulator.

---

## ⚠️ Critical Constraints

1. **Package Manager Policy**: Always use `pnpm`. Under no circumstances should `npm` or `yarn` be executed.
2. **Security**: Ensure that no unverified third-party libraries are introduced. The interactive canvas uses standard React state binding with SVG nodes. Do not import raw script tags or load external JS files.
3. **Vanilla CSS**: Maximize visual polish using standard CSS and custom variables. Avoid using Tailwind CSS unless explicitly requested by the user.
4. **Documentation Sync**: Every time changes are committed or pushed to remote, ensure that `README.md`, legal compliance pages (`privacy.html`, `terms.html`), and shortcuts documentation (`shortcuts.html`) are reviewed and updated to keep documentation synchronized with implementation features.

---

## 📁 Project Structure

```text
/
├── index.html                  # Main page template (custom fonts & style rules)
├── package.json                # Project configurations & dependency declarations
├── vite.config.ts              # Vite settings
├── gemini.md                   # This developer & context specification file
├── README.md                   # User documentation
└── src/
    ├── main.tsx                # Entrypoint
    ├── App.tsx                 # Layout controller & top-level coordinate flow
    ├── types.ts                # App typescript models (Units, Room, Shapes)
    ├── index.css               # Core styling sheet (Variables, classes, themes)
    └── components/
        ├── Canvas.tsx          # Main SVG drawing board, controls drag, scale, rotate
        ├── Sidebar.tsx         # Item library, specific width/depth inputs, bill of materials
        ├── Header.tsx          # Actions toolbar (Undo/Redo, Export JSON, Unit Switch)
        └── FurnitureSymbols.tsx# SVG definitions for realistic furniture designs
```

---

## 🎨 Theme & Visual Tokens

The simulator uses a premium glassmorphic dark-mode palette defined in `src/index.css`:

- **Primary Background**: `#0b0f19` (Very dark blue-gray)
- **Secondary Background / Sidebar**: `#111827` with opacity (`rgba(17, 24, 39, 0.8)`) and `backdrop-filter: blur(12px)`
- **Border Gradients**: Glowing borders in Neon Cyan `#38bdf8` and Electric Indigo `#6366f1`
- **Text Color**: `#f3f4f6` (Off-white primary) and `#9ca3af` (Gray secondary)
- **Active Accents**: Indigo-600 (`#4f46e5`) and Sky-400 (`#38bdf8`)

---

## 📐 SVG Math & Coordinate Systems

- **Base Scale**: The system operates natively in **centimeters (cm)**. All vertices and object coordinates are stored in cm.
- **Dynamic Bounding Box**: Viewport fitting centers the layout by computing the bounding box limits (`minX`, `maxX`, `minY`, `maxY`) from room boundary vertices:
  `roomWidthCm = maxX - minX`
  `roomHeightCm = maxY - minY`
  Centering offsets scale coordinates cleanly and translate inside the canvas:
  `transform="scale(renderScale) translate(-minX, -minY)"`
- **Polygonal Corners & Splitting**:
  - Dragging corners directly moves vertices, snapping coordinates to the active grid.
  - Adding corners inserts new points at wall midpoints, dividing segments.
  - Double-clicking corners deletes them (with a 3-vertex minimum floor).
- **Vector Intersection Math (Distance Guides)**:
  Project lines from an object center `(cx, cy)` horizontally/vertically, solving intersections with wall segment lines `P_i -> P_next`:
  - Horizontal intersections: `ix = x1 + (cy - y1) * (x2 - x1) / (y2 - y1)`
  - Vertical intersections: `iy = y1 + (cx - x1) * (y2 - y1) / (x2 - x1)`
- **Imperial Conversion**:
  - `1 inch = 2.54 cm`
  - `1 foot = 30.48 cm`
  - Imperial coordinates are converted for UI labels but saved in centimeters to prevent precision loss.

---

## 🛋️ Predefined Object Blueprints

The component `src/components/FurnitureSymbols.tsx` provides clean blueprint-style details:
- **Bed**: Shows pillow and blanket shapes.
- **Nightstand**: Shows top surface, drawer divider, and lamp outline.
- **Dresser**: Front drawer pull indicators.
- **Stairs**: Step count steps with direction arrows.
- **Door**: Swing arc representation.
- **Window**: Multi-pane architectural layout.
- **Box**: Flaps line details.
- **Text**: Custom dynamic text container.
