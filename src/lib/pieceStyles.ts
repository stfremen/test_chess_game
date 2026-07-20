export interface PieceStyle {
  id: string;
  name: string;
  whiteFill: string;
  whiteStroke: string;
  blackFill: string;
  blackStroke: string;
}

export const PIECE_STYLES: PieceStyle[] = [
  {
    id: "classic",
    name: "Classic",
    whiteFill: "#ffffff",
    whiteStroke: "#1e293b",
    blackFill: "#111827",
    blackStroke: "#f8fafc",
  },
  {
    id: "ocean",
    name: "Ocean",
    whiteFill: "#e0f2fe",
    whiteStroke: "#075985",
    blackFill: "#1e3a8a",
    blackStroke: "#bfdbfe",
  },
  {
    id: "sunset",
    name: "Sunset",
    whiteFill: "#fff7ed",
    whiteStroke: "#9a3412",
    blackFill: "#7c2d12",
    blackStroke: "#fed7aa",
  },
  {
    id: "neon",
    name: "Neon",
    whiteFill: "#f0fdf4",
    whiteStroke: "#15803d",
    blackFill: "#052e16",
    blackStroke: "#4ade80",
  },
];

export const DEFAULT_PIECE_STYLE_ID = PIECE_STYLES[0].id;

export function getPieceStyle(id: string): PieceStyle {
  return PIECE_STYLES.find((s) => s.id === id) ?? PIECE_STYLES[0];
}
