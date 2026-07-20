export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
  swatchLight: string;
  swatchDark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: "classic",
    name: "Classic",
    light: "bg-amber-100",
    dark: "bg-amber-700",
    swatchLight: "#fef3c7",
    swatchDark: "#b45309",
  },
  {
    id: "forest",
    name: "Forest",
    light: "bg-lime-100",
    dark: "bg-green-700",
    swatchLight: "#ecfccb",
    swatchDark: "#15803d",
  },
  {
    id: "ocean",
    name: "Ocean",
    light: "bg-sky-100",
    dark: "bg-blue-700",
    swatchLight: "#e0f2fe",
    swatchDark: "#1d4ed8",
  },
  {
    id: "slate",
    name: "Slate",
    light: "bg-gray-300",
    dark: "bg-gray-600",
    swatchLight: "#d1d5db",
    swatchDark: "#4b5563",
  },
  {
    id: "rose",
    name: "Rose",
    light: "bg-rose-100",
    dark: "bg-rose-700",
    swatchLight: "#ffe4e6",
    swatchDark: "#be123c",
  },
];

export const DEFAULT_BOARD_THEME_ID = BOARD_THEMES[0].id;

export function getBoardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}
