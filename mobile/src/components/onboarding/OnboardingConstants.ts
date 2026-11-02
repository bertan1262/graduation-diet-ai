export const ALLERGY_OPTIONS = [
  { id: '🥜 Fıstık (Hafif)', label: 'Fıstık / Kuruyemiş', emoji: '🥜' },
  { id: '🥛 Laktoz (Düşük Tolerans)', label: 'Laktoz', emoji: '🥛' },
  { id: '🌾 Gluten Hassasiyeti', label: 'Glüten', emoji: '🌾' },
  { id: '🌱 Vejetaryen', label: 'Vejetaryen', emoji: '🌱' },
  { id: '🥑 Ketojenik', label: 'Ketojenik / Düşük Karb', emoji: '🥑' },
  { id: '🦐 Deniz Ürünleri', label: 'Deniz Ürünleri', emoji: '🦐' },
  { id: '🥚 Yumurta Hassasiyeti', label: 'Yumurta', emoji: '🥚' },
];

export const DIET_TYPES = [
  {
    id: 'balanced',
    title: 'Dengeli',
    subtitle: 'Karbonhidrat (%40), protein (%30) ve yağ (%30) dengesi',
    emoji: '🥗',
    macros: { p: 0.3, c: 0.4, f: 0.3 },
  },
  {
    id: 'high_protein',
    title: 'Yüksek Protein',
    subtitle: 'Kas kazanımı ve korunumu için ekstra protein (%35 P / %40 K / %25 Y)',
    emoji: '🥩',
    macros: { p: 0.35, c: 0.4, f: 0.25 },
  },
  {
    id: 'low_carb',
    title: 'Düşük Karbonhidrat',
    subtitle: 'Daha az karbonhidrat, daha çok protein ve sağlıklı yağ (%35 P / %25 K / %40 Y)',
    emoji: '🥦',
    macros: { p: 0.35, c: 0.25, f: 0.4 },
  },
  {
    id: 'keto',
    title: 'Ketojenik',
    subtitle: 'Çok düşük karbonhidrat, yüksek yağ (%25 P / %10 K / %65 Y)',
    emoji: '🥑',
    macros: { p: 0.25, c: 0.1, f: 0.65 },
  },
  {
    id: 'mediterranean',
    title: 'Akdeniz Tipi',
    subtitle: 'Sebze, tam tahıl ve zeytinyağı ağırlıklı (%25 P / %45 K / %30 Y)',
    emoji: '🫒',
    macros: { p: 0.25, c: 0.45, f: 0.3 },
  },
];

export const OBSTACLE_OPTIONS = [
  { id: 'Çikolata ve şekerlemeyi çok seviyorum', emoji: '🍫', label: 'Çikolata ve şekerlemeyi çok seviyorum' },
  { id: 'Gece geç saatlerde atıştırmak', emoji: '🌙', label: 'Gece geç saatlerde atıştırmak' },
  { id: 'Abur cubur benim zayıf noktam', emoji: '🍟', label: 'Abur cubur benim zayıf noktam' },
  { id: 'Yoğun bir program', emoji: '⏰', label: 'Yoğun bir program ve düzensiz öğünler' },
  { id: 'Destek ve motivasyon eksikliği', emoji: '🤝', label: 'Destek ve motivasyon eksikliği' },
];

export const PACE_OPTIONS = [
  { value: 0.2, label: 'Yavaş', animal: '🦥', desc: 'Esnek ve yumuşak geçiş' },
  { value: 0.5, label: 'Önerilen', animal: '🐇', desc: 'İdeal ve sürdürülebilir tempo' },
  { value: 0.8, label: 'Hızlı', animal: '🐆', desc: 'Disiplinli ve yoğun program' },
];

export const FIRST_MEAL_TIMES = ['07:30', '08:30', '09:00', '10:00', '11:00'];
export const LAST_MEAL_TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00'];

export type OnboardingStage = 'welcome' | 'wizard' | 'calculating' | 'summary';

export const TOTAL_WIZARD_STEPS = 6;

export interface OnboardingPhase {
  id: number;
  title: string;
  emoji: string;
  steps: number[];
}

export const ONBOARDING_PHASES: OnboardingPhase[] = [
  { id: 1, title: 'Fiziksel Profil', emoji: '👤', steps: [0, 1] },
  { id: 2, title: 'Aktivite & Hedef', emoji: '🎯', steps: [2, 3] },
  { id: 3, title: 'Sağlık & Beslenme', emoji: '🥗', steps: [4, 5] },
];
