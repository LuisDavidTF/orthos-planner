import React from 'react';
import type { ObjectType } from '../types';

interface FurnitureSymbolProps {
  type: ObjectType;
  width: number;  // in pixels (already scaled from cm)
  height: number; // in pixels (already scaled from cm)
  color: string;  // color string
  text?: string;  // optional text label
}

export const FurnitureSymbol: React.FC<FurnitureSymbolProps> = ({
  type,
  width,
  height,
  color,
  text,
}) => {
  const fillAlpha = color + '15'; // ~8% opacity
  const lineAlpha = color + '99'; // ~60% opacity

  const commonProps = {
    fill: fillAlpha,
    stroke: color,
    strokeWidth: 2,
  };

  switch (type) {
    case 'bed': {
      // Draw a bed frame, mattress, two pillows (if width is large enough, else one), and duvet crease
      const isDouble = width > 70; // in px scale (usually width in cm is > 120cm)
      const pillowW = isDouble ? Math.min(width * 0.35, 45) : width * 0.7;
      const pillowH = Math.min(height * 0.18, 20);
      const pillowY = 6;
      const mattressInset = 4;

      return (
        <g>
          {/* Bed frame */}
          <rect x={0} y={0} width={width} height={height} rx={4} {...commonProps} />
          
          {/* Mattress */}
          <rect
            x={mattressInset}
            y={mattressInset}
            width={width - mattressInset * 2}
            height={height - mattressInset * 2}
            rx={3}
            fill="none"
            stroke={lineAlpha}
            strokeWidth={1.5}
          />
          
          {/* Pillows */}
          {isDouble ? (
            <>
              {/* Left Pillow */}
              <rect
                x={width * 0.1}
                y={pillowY}
                width={pillowW}
                height={pillowH}
                rx={2}
                fill="none"
                stroke={lineAlpha}
                strokeWidth={1.5}
              />
              {/* Right Pillow */}
              <rect
                x={width * 0.9 - pillowW}
                y={pillowY}
                width={pillowW}
                height={pillowH}
                rx={2}
                fill="none"
                stroke={lineAlpha}
                strokeWidth={1.5}
              />
            </>
          ) : (
            /* Single Pillow */
            <rect
              x={(width - pillowW) / 2}
              y={pillowY}
              width={pillowW}
              height={pillowH}
              rx={2}
              fill="none"
              stroke={lineAlpha}
              strokeWidth={1.5}
            />
          )}

          {/* Duvet fold/crease line */}
          <path
            d={`M ${mattressInset} ${height * 0.4} L ${width - mattressInset} ${height * 0.4}`}
            stroke={lineAlpha}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <path
            d={`M ${mattressInset} ${height * 0.45} Q ${width / 2} ${height * 0.52} ${width - mattressInset} ${height * 0.45}`}
            fill="none"
            stroke={lineAlpha}
            strokeWidth={1.5}
          />
        </g>
      );
    }

    case 'nightstand': {
      // Nightstand with a drawer line, drawer pull, and a small table lamp
      return (
        <g>
          {/* Main box */}
          <rect x={0} y={0} width={width} height={height} rx={2} {...commonProps} />
          
          {/* Front drawer panel edge */}
          <line x1={2} y1={height - 6} x2={width - 2} y2={height - 6} stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Handle */}
          <line
            x1={width / 2 - 5}
            y1={height - 3}
            x2={width / 2 + 5}
            y2={height - 3}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Table lamp icon on nightstand */}
          <circle cx={width / 2} cy={height * 0.4} r={Math.min(width, height) * 0.15} fill={color + '33'} stroke={color} strokeWidth={1} />
          <circle cx={width / 2} cy={height * 0.4} r={2} fill={color} />
        </g>
      );
    }

    case 'dresser': {
      // Dresser with double drawers and mirror projection lines
      const halfW = width / 2;
      return (
        <g>
          {/* Main frame */}
          <rect x={0} y={0} width={width} height={height} rx={3} {...commonProps} />
          
          {/* Dresser depth panel lines */}
          <line x1={0} y1={4} x2={width} y2={4} stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Vertical drawer divider */}
          <line x1={halfW} y1={4} x2={halfW} y2={height} stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Left Handle */}
          <line x1={halfW * 0.5 - 6} y1={height / 2 + 2} x2={halfW * 0.5 + 6} y2={height / 2 + 2} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          
          {/* Right Handle */}
          <line x1={halfW * 1.5 - 6} y1={height / 2 + 2} x2={halfW * 1.5 + 6} y2={height / 2 + 2} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
    }

    case 'stairs': {
      // Draw stairs with steps and up arrow
      const stepCount = Math.max(3, Math.floor(height / 15));
      const stepLines = [];
      for (let i = 1; i < stepCount; i++) {
        const y = (height / stepCount) * i;
        stepLines.push(
          <line key={i} x1={0} y1={y} x2={width} y2={y} stroke={lineAlpha} strokeWidth={1.5} />
        );
      }

      return (
        <g>
          <rect x={0} y={0} width={width} height={height} rx={1} {...commonProps} />
          {stepLines}
          {/* Directional Up Arrow */}
          <path
            d={`M ${width * 0.5} ${height * 0.85} L ${width * 0.5} ${height * 0.15} M ${width * 0.5} ${height * 0.15} L ${width * 0.4} ${height * 0.28} M ${width * 0.5} ${height * 0.15} L ${width * 0.6} ${height * 0.28}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    case 'box': {
      // Storage box: rectangle with cross lines representing folded flaps
      return (
        <g>
          <rect x={0} y={0} width={width} height={height} rx={2} {...commonProps} />
          {/* Inner flap box lines */}
          <rect x={2} y={2} width={width - 4} height={height - 4} fill="none" stroke={lineAlpha} strokeWidth={1} strokeDasharray="2 2" />
          
          {/* Flap fold lines */}
          <line x1={0} y1={0} x2={width} y2={height} stroke={lineAlpha} strokeWidth={1.5} />
          <line x1={width} y1={0} x2={0} y2={height} stroke={lineAlpha} strokeWidth={1.5} />
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.12} fill={fillAlpha} stroke={color} strokeWidth={1.5} />
        </g>
      );
    }

    case 'door': {
      // Door architectural symbol: frame, door panel swinging open, and a 90-degree arc swing.
      // Width is doorway size. Height is door thickness / length. Usually height is smaller (e.g. 5-8cm).
      // We will model x, y as the pivot point.
      // Standard swing: 1/4 arc
      return (
        <g>
          {/* Transparent click hitbox sector covering the 90-degree swing area */}
          <path
            d={`M 0 0 A ${width} ${width} 0 0 1 ${width} ${width} L 0 ${width} Z`}
            fill="transparent"
            style={{ cursor: 'move' }}
          />
          {/* Swing arc */}
          <path
            d={`M 0 0 A ${width} ${width} 0 0 1 ${width} ${width}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          {/* Door panel itself */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={width}
            stroke={color}
            strokeWidth={5}
            strokeLinecap="square"
          />
          {/* Pivot hinge point dot */}
          <circle cx={0} cy={0} r={3} fill={color} />
          {/* Wall jamb side indicators */}
          <rect x={-4} y={-4} width={8} height={8} fill={color} />
          <rect x={width - 4} y={-4} width={8} height={8} fill="none" stroke={color} strokeWidth={1.5} />
        </g>
      );
    }

    case 'window': {
      // Window: wall cutout symbol (thin frame, double glass center pane)
      // Usually represented by double long lines fitting in the wall thickness.
      const glassInset = height * 0.35;
      return (
        <g>
          {/* Wall opening bounds */}
          <rect x={0} y={0} width={width} height={height} rx={1} {...commonProps} />
          {/* Double glass panes in center */}
          <line x1={0} y1={glassInset} x2={width} y2={glassInset} stroke={lineAlpha} strokeWidth={1.5} />
          <line x1={0} y1={height - glassInset} x2={width} y2={height - glassInset} stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Center sash slider indicator */}
          <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke={color} strokeWidth={1.5} />
          
          {/* Window pane diagonal reflections */}
          <line x1={width * 0.2} y1={glassInset + 1} x2={width * 0.28} y2={height - glassInset - 1} stroke={lineAlpha} strokeWidth={1} />
          <line x1={width * 0.7} y1={glassInset + 1} x2={width * 0.78} y2={height - glassInset - 1} stroke={lineAlpha} strokeWidth={1} />
        </g>
      );
    }

    case 'sofa': {
      const armrestW = Math.min(width * 0.12, 16);
      const backrestD = Math.min(height * 0.18, 18);
      return (
        <g>
          {/* Main block */}
          <rect x={0} y={0} width={width} height={height} rx={6} {...commonProps} />
          
          {/* Back rest */}
          <rect x={2} y={2} width={width - 4} height={backrestD} rx={3} fill="none" stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Left arm rest */}
          <rect x={2} y={backrestD + 2} width={armrestW} height={height - backrestD - 4} rx={2} fill="none" stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Right arm rest */}
          <rect x={width - armrestW - 2} y={backrestD + 2} width={armrestW} height={height - backrestD - 4} rx={2} fill="none" stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Cushion divider line (if wide enough, split in cushions) */}
          {width > 80 ? (
            <line x1={width / 2} y1={backrestD + 2} x2={width / 2} y2={height - 2} stroke={lineAlpha} strokeWidth={1.5} />
          ) : null}
        </g>
      );
    }

    case 'table': {
      // Dining or desk table: wood grains style blueprint or inset frame
      const inset = Math.min(width, height) * 0.12;
      return (
        <g>
          {/* Table top */}
          <rect x={0} y={0} width={width} height={height} rx={4} {...commonProps} />
          {/* Inner support frame shadow */}
          <rect x={inset} y={inset} width={width - inset * 2} height={height - inset * 2} rx={2} fill="none" stroke={lineAlpha} strokeWidth={1} strokeDasharray="3 3" />
        </g>
      );
    }

    case 'chair': {
      // Office or dining chair: seat cushion and backrest detail
      const backH = height * 0.18;
      const cushionInset = width * 0.1;
      return (
        <g>
          {/* Main frame */}
          <rect x={0} y={0} width={width} height={height} rx={8} {...commonProps} />
          
          {/* Seat Cushion */}
          <rect x={cushionInset} y={backH + 4} width={width - cushionInset * 2} height={height - backH - 8} rx={4} fill="none" stroke={lineAlpha} strokeWidth={1.5} />
          
          {/* Back rest curve */}
          <path d={`M 4 ${backH + 2} Q ${width / 2} 2 ${width - 4} ${backH + 2}`} fill="none" stroke={color} strokeWidth={2} />
        </g>
      );
    }

    case 'wardrobe': {
      // Closet/Wardrobe: detailed double doors and hanger rods
      return (
        <g>
          <rect x={0} y={0} width={width} height={height} rx={2} {...commonProps} />
          
          {/* Inside rod guideline */}
          <line x1={6} y1={height / 2} x2={width - 6} y2={height / 2} stroke={lineAlpha} strokeWidth={1.5} strokeDasharray="4 2" />
          
          {/* Sliding door panels */}
          <rect x={4} y={3} width={width / 2 - 6} height={height - 6} rx={1} fill="none" stroke={lineAlpha} strokeWidth={1.2} />
          <rect x={width / 2 + 2} y={3} width={width / 2 - 6} height={height - 6} rx={1} fill="none" stroke={lineAlpha} strokeWidth={1.2} />
          
          {/* Wardrobe door pulls */}
          <line x1={width / 2 - 4} y1={height / 2 - 5} x2={width / 2 - 4} y2={height / 2 + 5} stroke={color} strokeWidth={2} strokeLinecap="round" />
          <line x1={width / 2 + 4} y1={height / 2 - 5} x2={width / 2 + 4} y2={height / 2 + 5} stroke={color} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    }

    case 'text':
    default: {
      // For text elements, we draw a clear dashed border (only visible when selected or hovered, otherwise invisible)
      // and center the text label inside the boundary.
      return (
        <g>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.3}
          />
          {/* Centered label */}
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontFamily="var(--font-heading)"
            fontWeight="600"
            fontSize={Math.max(10, Math.min(height * 0.4, 16))}
          >
            {text || 'Nota'}
          </text>
        </g>
      );
    }
  }
};
