/**
 * DietAI Mobile Design System - Color Palette
 * Curated specifically for modern health, nutrition, and wellness interfaces.
 * Supports Light Mode and OLED Dark Mode themes.
 */

export const Colors = {
  // Brand & Accent Colors
  primary: '#10B981',        // Emerald Green - Health, Vitality, Success
  primaryDark: '#059669',    // Deep Emerald - Pressed buttons & active borders
  primaryLight: '#D1FAE5',   // Soft Mint - Badges & active backgrounds
  primaryMuted: '#ECFDF5',   // Ultra Light Mint - Card highlight backgrounds

  // Macronutrient Semantic Colors
  calories: '#F59E0B',       // Amber / Orange - Caloric Energy & Ring Progress
  caloriesLight: '#FEF3C7',  // Soft Amber
  protein: '#3B82F6',        // Royal Blue - Muscle recovery & Protein goals
  proteinLight: '#DBEAFE',   // Soft Blue
  carbs: '#EAB308',          // Yellow-Gold - Carbohydrates
  carbsLight: '#FEF9C3',     // Soft Yellow
  fat: '#EC4899',            // Vibrant Pink/Rose - Healthy fats
  fatLight: '#FCE7F3',       // Soft Pink
  water: '#06B6D4',          // Cyan - Hydration & Water tracking
  waterLight: '#CFFAFE',     // Soft Cyan

  // Neutral & Surface Colors (Slate Scale)
  background: '#F8FAFC',     // Slate 50 - Main screen background
  surface: '#FFFFFF',        // Pure White - Cards, modals, bottom sheets
  surfaceSubtle: '#F1F5F9',  // Slate 100 - Input backgrounds & inactive chips
  border: '#E2E8F0',         // Slate 200 - Borders & dividers
  borderDark: '#CBD5E1',     // Slate 300 - Focused inputs

  // Typography Colors
  textPrimary: '#0F172A',    // Slate 900 - Headings & high-emphasis text
  textSecondary: '#334155',  // Slate 700 - Body copy & form labels
  textMuted: '#64748B',      // Slate 500 - Subtitles & captions
  textPlaceholder: '#94A3B8',// Slate 400 - Input placeholder text
  textInverse: '#FFFFFF',    // White text on dark/colored buttons

  // Feedback & Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Tab & Navigation
  tabActive: '#10B981',
  tabInactive: '#94A3B8',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

export const DarkColors = {
  // Brand & Accent Colors
  primary: '#10B981',        // Vivid Emerald Green
  primaryDark: '#059669',    // Deep Emerald
  primaryLight: 'rgba(16, 185, 129, 0.25)', 
  primaryMuted: 'rgba(16, 185, 129, 0.15)',

  // Macronutrient Semantic Colors
  calories: '#F59E0B',
  caloriesLight: 'rgba(245, 158, 11, 0.25)',
  protein: '#3B82F6',
  proteinLight: 'rgba(59, 130, 246, 0.25)',
  carbs: '#EAB308',
  carbsLight: 'rgba(234, 179, 8, 0.25)',
  fat: '#EC4899',
  fatLight: 'rgba(236, 72, 153, 0.25)',
  water: '#06B6D4',
  waterLight: 'rgba(6, 182, 212, 0.25)',

  // Neutral & Surface Colors (Slate OLED Dark Scale)
  background: '#0B0F19',     // Pure Deep Midnight Slate
  surface: '#151D2F',        // High-end Dark Card Surface
  surfaceSubtle: '#1E293B',  // Slate 800 - inputs, cards, pills
  border: '#27354E',         // Subtle Dark Border
  borderDark: '#3E4F6E',

  // Typography Colors
  textPrimary: '#F8FAFC',    // Slate 50 - Bright white text
  textSecondary: '#CBD5E1',  // Slate 300 - Crisp readable body
  textMuted: '#94A3B8',      // Slate 400 - Subtitles & hints
  textPlaceholder: '#64748B',// Slate 500
  textInverse: '#FFFFFF',

  // Feedback & Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Tab & Navigation
  tabActive: '#10B981',
  tabInactive: '#64748B',
  tabBarBg: '#111827',
  tabBarBorder: '#1F2937',
};

export type ThemeColors = typeof Colors;

export const getThemeColors = (isDarkMode: boolean): ThemeColors => {
  return isDarkMode ? DarkColors : Colors;
};
