export const BASIC_COLORS_MAP: Record<string, string> = {
  // Bengali
  "লাল": "#ef4444",
  "সবুজ": "#22c55e",
  "নীল": "#3b82f6",
  "সাদা": "#ffffff",
  "হলুদ": "#eab308",
  "কালো": "#000000",
  "কমলা": "#f97316",
  "খয়েরি": "#a16207",
  "গোলাপি": "#ec4899",
  "ছাই": "#64748b",
  "বেগুনী": "#a855f7",
  // English
  "White": "#ffffff",
  "Red": "#ef4444",
  "Paste": "#14b8a6",
  "Yellow": "#eab308",
  "Golden": "#ca8a04",
  "Blue": "#3b82f6",
  "Black": "#000000",
  "Green": "#22c55e",
  "Orange": "#f97316"
};

export function getColorHex(colorName: string, configs: any[]): string {
  if (!colorName) return "#cbd5e1"; // fallback gray

  // 1. Check basic colors
  if (BASIC_COLORS_MAP[colorName]) return BASIC_COLORS_MAP[colorName];

  // 2. Check configs
  const config = configs?.find(c => c.name === colorName);
  if (config && config.colors && config.colors[2]) {
    return config.colors[2];
  }

  return "#cbd5e1"; // fallback gray
}
