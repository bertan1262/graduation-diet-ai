import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { LoggedMealItem, MealType } from '../../types';
import { useDietStore } from '../../store/useDietStore';

interface EditPortionModalProps {
  visible: boolean;
  meal: LoggedMealItem | null;
  onClose: () => void;
  onSave: (updatedMeal: LoggedMealItem) => void;
  onDelete?: (id: string) => void;
}

const MEAL_TYPE_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Kahvaltı', icon: '🍳' },
  { type: 'lunch', label: 'Öğle', icon: '☀️' },
  { type: 'dinner', label: 'Akşam', icon: '🌙' },
  { type: 'snack', label: 'Ara Öğün', icon: '🍎' },
];

export const EditPortionModal: React.FC<EditPortionModalProps> = ({
  visible,
  meal,
  onClose,
  onSave,
  onDelete,
}) => {
  const { userProfile, isDarkMode } = useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [portionGrams, setPortionGrams] = useState<number>(150);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [baseRatio, setBaseRatio] = useState<{
    baseGrams: number;
    baseCalories: number;
    baseProtein: number;
    baseCarbs: number;
    baseFat: number;
  }>({
    baseGrams: 150,
    baseCalories: 250,
    baseProtein: 20,
    baseCarbs: 20,
    baseFat: 10,
  });

  useEffect(() => {
    if (meal) {
      const g = meal.portionGrams || 150;
      setPortionGrams(g);
      setMealType(meal.mealType);
      setBaseRatio({
        baseGrams: g,
        baseCalories: meal.calories,
        baseProtein: meal.proteinGrams,
        baseCarbs: meal.carbsGrams,
        baseFat: meal.fatGrams,
      });
    }
  }, [meal]);

  // Scaled calculations based on user adjusted grams
  const scale = baseRatio.baseGrams > 0 ? portionGrams / baseRatio.baseGrams : 1;
  const currentCalories = Math.max(10, Math.round(baseRatio.baseCalories * scale));
  const currentProtein = Math.max(0, Math.round(baseRatio.baseProtein * scale * 10) / 10);
  const currentCarbs = Math.max(0, Math.round(baseRatio.baseCarbs * scale * 10) / 10);
  const currentFat = Math.max(0, Math.round(baseRatio.baseFat * scale * 10) / 10);

  // Quick portion increment / decrement
  const handleAdjustGrams = (delta: number) => {
    setPortionGrams((prev) => Math.max(20, Math.min(1000, prev + delta)));
  };

  // Milestone 3: Client-side Allergen & Clinical Safety Detection
  const safetyWarnings = useMemo(() => {
    if (!meal) return [];
    const warnings: { type: 'allergen' | 'clinical'; title: string; desc: string }[] = [];

    const mealNameLower = meal.name.toLowerCase();
    const mealAllergens = (meal.allergens || []).map((a) => a.toLowerCase());

    // 1. Allergen Check against userProfile.allergies
    const userAllergies = userProfile.allergies || [];
    for (const allergy of userAllergies) {
      const aLower = allergy.toLowerCase();
      let isMatch = false;

      if (aLower.includes('gluten') && (mealNameLower.includes('ekmek') || mealNameLower.includes('yulaf') || mealNameLower.includes('buğday') || mealNameLower.includes('un') || mealNameLower.includes('makarna') || mealNameLower.includes('börek') || mealAllergens.includes('gluten'))) {
        isMatch = true;
      } else if (aLower.includes('laktoz') && (mealNameLower.includes('süt') || mealNameLower.includes('peynir') || mealNameLower.includes('yoğurt') || mealNameLower.includes('krema') || mealAllergens.includes('laktoz'))) {
        isMatch = true;
      } else if (aLower.includes('fındık') && (mealNameLower.includes('fındık') || mealNameLower.includes('fıstık') || mealNameLower.includes('ceviz') || mealNameLower.includes('badem') || mealAllergens.includes('fındık') || mealAllergens.includes('fıstık'))) {
        isMatch = true;
      } else if (aLower.includes('yumurta') && (mealNameLower.includes('yumurta') || mealNameLower.includes('omlet') || mealAllergens.includes('yumurta'))) {
        isMatch = true;
      } else if (aLower.includes('deniz') && (mealNameLower.includes('balık') || mealNameLower.includes('somon') || mealNameLower.includes('ton') || mealNameLower.includes('karides'))) {
        isMatch = true;
      } else if (mealNameLower.includes(aLower) || mealAllergens.includes(aLower)) {
        isMatch = true;
      }

      if (isMatch) {
        warnings.push({
          type: 'allergen',
          title: `⚠️ Alerjen Uyarısı: ${allergy}`,
          desc: `Profilinizde ${allergy} hassasiyeti kayıtlıdır. Bu öğünün içeriğini kontrol ediniz.`,
        });
      }
    }

    // 2. Clinical Condition Guardrails
    if (userProfile.hasDiabetes && currentCarbs > 35) {
      warnings.push({
        type: 'clinical',
        title: '🩸 Diyabet İkazı',
        desc: `Bu porsiyon ${currentCarbs}g karbonhidrat içeriyor. Kan şekeri regülasyonu için porsiyonu azaltabilir veya lif takviyesi ekleyebilirsiniz.`,
      });
    }

    if (userProfile.hasCholesterol && currentFat > 18) {
      warnings.push({
        type: 'clinical',
        title: '🫀 Kolesterol İkazı',
        desc: `Porsiyondaki ${currentFat}g yağ doymuş yağ asitleri barındırabilir. Tüketim sıklığına özen gösteriniz.`,
      });
    }

    if (userProfile.hasHypertension && (mealNameLower.includes('zeytin') || mealNameLower.includes('turşu') || mealNameLower.includes('salamura') || mealNameLower.includes('peynir'))) {
      warnings.push({
        type: 'clinical',
        title: '🩺 Hipertansiyon İkazı',
        desc: 'Bu besin yüksek oranda sodyum (tuz) barındırabilir. Kan basıncınız için porsiyonu sınırlayınız.',
      });
    }

    return warnings;
  }, [meal, userProfile, currentCarbs, currentFat]);

  const handleSave = () => {
    if (!meal) return;
    const updated: LoggedMealItem = {
      ...meal,
      portionGrams,
      mealType,
      calories: currentCalories,
      proteinGrams: currentProtein,
      carbsGrams: currentCarbs,
      fatGrams: currentFat,
      warningMessage: safetyWarnings.length > 0 ? safetyWarnings[0].title : undefined,
    };
    onSave(updated);
    onClose();
  };

  if (!meal) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {meal.name}
              </Text>
              <Text style={styles.subtitle}>Porsiyon & Besin Değerlerini Düzenle</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Safety Warnings Banner (Milestone 3) */}
            {safetyWarnings.length > 0 && (
              <View style={styles.warningsContainer}>
                {safetyWarnings.map((warn, i) => (
                  <View
                    key={`warn-${i}`}
                    style={[
                      styles.warningBox,
                      {
                        backgroundColor:
                          warn.type === 'allergen'
                            ? isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'
                            : isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                        borderColor:
                          warn.type === 'allergen'
                            ? isDarkMode ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5'
                            : isDarkMode ? 'rgba(245, 158, 11, 0.4)' : '#FCD34D',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.warningTitle,
                        { color: warn.type === 'allergen' ? theme.danger : theme.calories },
                      ]}
                    >
                      {warn.title}
                    </Text>
                    <Text style={styles.warningDesc}>{warn.desc}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Meal Type Selector Chips */}
            <Text style={styles.sectionHeading}>Öğün Kategorisi</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPE_OPTIONS.map((opt) => {
                const isSelected = mealType === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[
                      styles.mealTypeChip,
                      isSelected && {
                        backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => setMealType(opt.type)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mealTypeIcon}>{opt.icon}</Text>
                    <Text
                      style={[
                        styles.mealTypeLabel,
                        isSelected && { color: theme.primary, fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Grammage Controller */}
            <Text style={styles.sectionHeading}>Tüketilen Miktar (Gram)</Text>
            <View style={styles.gramControlRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjustGrams(-50)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>-50g</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjustGrams(-10)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>-10g</Text>
              </TouchableOpacity>

              <View style={styles.gramDisplayBox}>
                <TextInput
                  style={styles.gramInput}
                  keyboardType="numeric"
                  value={portionGrams.toString()}
                  onChangeText={(val) => {
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      setPortionGrams(Math.max(10, Math.min(1500, parsed)));
                    } else if (val === '') {
                      setPortionGrams(0);
                    }
                  }}
                  selectTextOnFocus
                />
                <Text style={styles.gramUnitText}>gram</Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjustGrams(10)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>+10g</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjustGrams(50)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>+50g</Text>
              </TouchableOpacity>
            </View>

            {/* Recalculated Nutrition Summary Cards */}
            <Text style={styles.sectionHeading}>Yeniden Hesaplanmış Besin Değerleri</Text>
            <View style={styles.nutritionCardsGrid}>
              <View style={[styles.nutritionCard, { borderColor: theme.primaryLight }]}>
                <Text style={[styles.nutritionCardValue, { color: theme.primary }]}>
                  {currentCalories}
                </Text>
                <Text style={styles.nutritionCardLabel}>Kalori (kcal)</Text>
              </View>

              <View style={[styles.nutritionCard, { borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE' }]}>
                <Text style={[styles.nutritionCardValue, { color: theme.protein }]}>
                  {currentProtein}g
                </Text>
                <Text style={styles.nutritionCardLabel}>Protein</Text>
              </View>

              <View style={[styles.nutritionCard, { borderColor: isDarkMode ? '#78350F' : '#FDE68A' }]}>
                <Text style={[styles.nutritionCardValue, { color: theme.calories }]}>
                  {currentCarbs}g
                </Text>
                <Text style={styles.nutritionCardLabel}>Karbonhidrat</Text>
              </View>

              <View style={[styles.nutritionCard, { borderColor: isDarkMode ? '#831843' : '#FBCFE8' }]}>
                <Text style={[styles.nutritionCardValue, { color: theme.fat }]}>
                  {currentFat}g
                </Text>
                <Text style={styles.nutritionCardLabel}>Yağ</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons Footer */}
          <View style={styles.footerRow}>
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteActionBtn}
                onPress={() => {
                  onDelete(meal.id);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteActionText}>🗑️ Sil</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.saveActionBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveActionText}>✓ Güncelle & Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: BorderRadius.xxl,
      borderTopRightRadius: BorderRadius.xxl,
      padding: Spacing.xl,
      maxHeight: '85%',
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.card,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      ...Typography.h2,
      color: theme.textPrimary,
    },
    subtitle: {
      ...Typography.caption,
      color: theme.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    closeBtnText: {
      ...Typography.bodyBold,
      color: theme.textSecondary,
    },
    scrollBody: {
      paddingVertical: Spacing.md,
    },
    warningsContainer: {
      marginBottom: Spacing.md,
      gap: Spacing.xs,
    },
    warningBox: {
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    warningTitle: {
      ...Typography.captionBold,
      marginBottom: 2,
    },
    warningDesc: {
      ...Typography.tiny,
      color: theme.textSecondary,
      lineHeight: 16,
    },
    sectionHeading: {
      ...Typography.captionBold,
      color: theme.textSecondary,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    mealTypeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.xs,
    },
    mealTypeChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSubtle,
    },
    mealTypeIcon: {
      fontSize: 18,
      marginBottom: 2,
    },
    mealTypeLabel: {
      ...Typography.tiny,
      color: theme.textSecondary,
    },
    gramControlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.xs,
    },
    stepBtn: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 48,
    },
    stepBtnText: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    gramDisplayBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xs,
      backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
      borderRadius: BorderRadius.md,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    gramInput: {
      ...Typography.h2,
      color: theme.textPrimary,
      textAlign: 'center',
      padding: 0,
      minWidth: 70,
    },
    gramUnitText: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: -2,
    },
    nutritionCardsGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    nutritionCard: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
    },
    nutritionCardValue: {
      ...Typography.bodyBold,
      marginBottom: 2,
    },
    nutritionCardLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      textAlign: 'center',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    deleteActionBtn: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteActionText: {
      ...Typography.captionBold,
      color: theme.danger,
    },
    saveActionBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.glow,
    },
    saveActionText: {
      ...Typography.bodyBold,
      color: '#FFFFFF',
    },
  });
