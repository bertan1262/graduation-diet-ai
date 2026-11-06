export type CanonicalAllergen = 'lactose' | 'gluten' | 'peanut' | 'seafood' | 'egg';

interface AllergenRule {
  id: CanonicalAllergen;
  label: string;
  userTriggers: string[];
  foodKeywords: string[];
  safeNegations: string[];
}

export const ALLERGEN_RULES: AllergenRule[] = [
  {
    id: 'lactose',
    label: 'Laktoz (Süt)',
    userTriggers: ['laktoz', 'lactose', 'süt', 'peynir', 'yoğurt'],
    foodKeywords: [
      'lactose',
      'laktoz',
      'süt',
      'peynir',
      'yoğurt',
      'krema',
      'hellim',
      'kefir',
      'lor',
      'kaşar',
      'tereyağ',
      'cacık',
    ],
    safeNegations: [
      'laktozsuz süzme yoğurt',
      'laktozsuz probiyotik yoğurt',
      'laktozsuz probiyotik kefir',
      'laktozsuz sade kefir',
      'laktozsuz yoğurt',
      'laktozsuz kefir',
      'laktozsuz süt',
      'laktozsuz peynir',
      'laktozsuz krema',
      'laktozsuz',
      'sütsüz',
      'yoğurtsuz',
      'peynirsiz',
      'badem sütü',
      'yulaf sütü',
      'hindistan cevizi sütü',
    ],
  },
  {
    id: 'gluten',
    label: 'Gluten (Buğday)',
    userTriggers: ['gluten', 'glüten', 'buğday', 'çölyak'],
    foodKeywords: [
      'gluten',
      'glüten',
      'buğday',
      'ekmek',
      'ekmeği',
      'yulaf',
      'makarna',
      'börek',
      'bulgur',
      'erişte',
      'simit',
      'lavaş',
    ],
    safeNegations: [
      'glutensiz karabuğday ekmeği',
      'glutensiz mısır ekmeği',
      'glutensiz ekmek',
      'glutensiz ekmeği',
      'glütensiz ekmek',
      'glütensiz ekmeği',
      'glutensiz yulaf',
      'glutensiz makarna',
      'glutensiz lavaş',
      'glutensiz',
      'glütensiz',
      'karabuğday ekmeği',
      'karabuğday',
      'mısır ekmeği',
      'ekmeksiz',
    ],
  },
  {
    id: 'peanut',
    label: 'Fıstık / Kuruyemiş',
    userTriggers: ['fıstık', 'fındık', 'ceviz', 'badem', 'kaju', 'kuruyemiş', 'peanut'],
    foodKeywords: [
      'peanut',
      'fıstık',
      'fındık',
      'ceviz',
      'badem',
      'kaju',
      'kuruyemiş',
    ],
    safeNegations: ['fıstıksız', 'kuruyemişsiz', 'cevizsiz', 'badem sütü', 'hindistan cevizi'],
  },
  {
    id: 'seafood',
    label: 'Deniz Ürünü',
    userTriggers: ['deniz', 'seafood', 'balık', 'somon', 'ton', 'karides'],
    foodKeywords: [
      'seafood',
      'deniz ürün',
      'balık',
      'somon',
      'ton',
      'levrek',
      'çipura',
      'karides',
      'kalamar',
      'midye',
      'hamsi',
    ],
    safeNegations: [],
  },
  {
    id: 'egg',
    label: 'Yumurta',
    userTriggers: ['yumurta', 'egg', 'omlet'],
    foodKeywords: ['egg', 'yumurta', 'omlet', 'menemen'],
    safeNegations: ['yumurtasız'],
  },
];

function stripSafeNegations(text: string, negations: string[]): string {
  let cleaned = text;
  for (const neg of negations) {
    cleaned = cleaned.split(neg).join(' ');
  }
  return cleaned;
}

function containsFoodKeyword(text: string, kw: string): boolean {
  if (kw === 'ton' || kw === 'lor') {
    const regex = new RegExp(`(^|[^a-zçğıöşü])${kw}([a-zçğıöşü]{0,3})($|[^a-zçğıöşü])`, 'i');
    return regex.test(text);
  }
  return text.includes(kw);
}

export interface AllergenMatchResult {
  /** User profile allergy strings that were triggered (e.g. "🥜 Fıstık (Hafif)") */
  matchedUserAllergies: string[];
  /** Standardized Turkish allergen category labels (e.g. "Fıstık / Kuruyemiş") */
  canonicalLabels: string[];
  /** Standardized allergen IDs (e.g. "peanut") */
  canonicalIds: CanonicalAllergen[];
}

/**
 * Matches a meal's name/description and explicit allergen tags against the user's declared allergies.
 * Handles both Turkish and English allergen identifiers and respects safe negations (e.g. "laktozsuz").
 */
function normalizeTr(str: string): string {
  return str.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

export function matchUserAllergens(params: {
  foodText?: string;
  foodAllergens?: string[];
  userAllergies?: string[];
}): AllergenMatchResult {
  const { foodText = '', foodAllergens = [], userAllergies = [] } = params;
  if (!userAllergies || userAllergies.length === 0) {
    return { matchedUserAllergies: [], canonicalLabels: [], canonicalIds: [] };
  }

  const lowerText = normalizeTr(foodText);
  const lowerTags = foodAllergens.map((a) => normalizeTr(a));

  const matchedUserAllergies: string[] = [];
  const canonicalLabelsSet = new Set<string>();
  const canonicalIdsSet = new Set<CanonicalAllergen>();

  for (const userAllergy of userAllergies) {
    const aLower = normalizeTr(userAllergy);
    let userAllergyMatched = false;

    for (const rule of ALLERGEN_RULES) {
      const userHasRuleAllergy = rule.userTriggers.some((trigger) => aLower.includes(trigger));
      if (!userHasRuleAllergy) continue;

      const explicitTagMatch = lowerTags.some(
        (tag) => tag === rule.id || rule.foodKeywords.some((kw) => tag.includes(kw))
      );

      const sanitizedText = lowerText
        ? stripSafeNegations(lowerText, rule.safeNegations)
        : '';
      const textKeywordMatch =
        sanitizedText.length > 0 &&
        rule.foodKeywords.some((kw) => containsFoodKeyword(sanitizedText, kw));

      if (explicitTagMatch || textKeywordMatch) {
        userAllergyMatched = true;
        canonicalLabelsSet.add(rule.label);
        canonicalIdsSet.add(rule.id);
      }
    }

    // Fallback direct substring match for custom user allergies
    if (!userAllergyMatched && aLower.length >= 3) {
      const directMatch =
        lowerTags.some((tag) => tag.includes(aLower) || aLower.includes(tag)) ||
        (lowerText.length > 0 && lowerText.includes(aLower));
      if (directMatch) {
        userAllergyMatched = true;
        canonicalLabelsSet.add(userAllergy);
      }
    }

    if (userAllergyMatched && !matchedUserAllergies.includes(userAllergy)) {
      matchedUserAllergies.push(userAllergy);
    }
  }

  return {
    matchedUserAllergies,
    canonicalLabels: Array.from(canonicalLabelsSet),
    canonicalIds: Array.from(canonicalIdsSet),
  };
}
