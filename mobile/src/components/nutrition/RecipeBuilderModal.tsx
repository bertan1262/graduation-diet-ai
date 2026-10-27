import React, { useState, useMemo } from 'react';
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
import { useDietStore } from '../../store/useDietStore';
import { CustomRecipe, CustomRecipeIngredient, MealType } from '../../types';

interface RecipeBuilderModalProps {
  visible: boolean;
  onClose: () => void;
}

const INGREDIENT_PRESETS: Omit<CustomRecipeIngredient, 'id'>[] = [
  {
    name: '🍗 Tavuk Göğsü',
    grams: 100,
    calories: 165,
    proteinGrams: 31,
    carbsGrams: 0,
    fatGrams: 3.6,
    fiberGrams: 0,
  },
  {
    name: '🥩 Yağsız Kıyma',
    grams: 100,
    calories: 175,
    proteinGrams: 22,
    carbsGrams: 0,
    fatGrams: 9,
    fiberGrams: 0,
  },
  {
    name: '🥚 Yumurta (1 Adet)',
    grams: 60,
    calories: 78,
    proteinGrams: 6.5,
    carbsGrams: 0.6,
    fatGrams: 5.3,
    fiberGrams: 0,
  },
  {
    name: '🌾 Yulaf Ezmesi',
    grams: 50,
    calories: 185,
    proteinGrams: 6.5,
    carbsGrams: 32,
    fatGrams: 3.5,
    fiberGrams: 5.0,
  },
  {
    name: '🧀 Lor Peyniri',
    grams: 100,
    calories: 98,
    proteinGrams: 14,
    carbsGrams: 3.5,
    fatGrams: 3.0,
    fiberGrams: 0,
  },
  {
    name: '🥑 Avokado (Yarım)',
    grams: 75,
    calories: 120,
    proteinGrams: 1.5,
    carbsGrams: 6,
    fatGrams: 11,
    fiberGrams: 5.0,
  },
  {
    name: '🫒 Zeytinyağı (1 YK)',
    grams: 14,
    calories: 119,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 13.5,
    fiberGrams: 0,
  },
  {
    name: '🥦 Fırın Sebze',
    grams: 150,
    calories: 55,
    proteinGrams: 2.5,
    carbsGrams: 10,
    fatGrams: 0.5,
    fiberGrams: 4.2,
  },
];

export const RecipeBuilderModal: React.FC<RecipeBuilderModalProps> = ({
  visible,
  onClose,
}) => {
  const { customRecipes, addCustomRecipe, removeCustomRecipe, addMeal, isDarkMode } =
    useDietStore();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [activeTab, setActiveTab] = useState<'saved' | 'create'>('saved');
  const [recipeTitle, setRecipeTitle] = useState('Ev Yapımı Protein Pankek');
  const [servings, setServings] = useState(2);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [ingredients, setIngredients] = useState<CustomRecipeIngredient[]>([
    {
      id: 'init-1',
      name: '🌾 Yulaf Ezmesi',
      grams: 50,
      calories: 185,
      proteinGrams: 6.5,
      carbsGrams: 32,
      fatGrams: 3.5,
      fiberGrams: 5.0,
    },
    {
      id: 'init-2',
      name: '🥚 Yumurta (1 Adet)',
      grams: 60,
      calories: 78,
      proteinGrams: 6.5,
      carbsGrams: 0.6,
      fatGrams: 5.3,
      fiberGrams: 0,
    },
    {
      id: 'init-3',
      name: '🧀 Lor Peyniri',
      grams: 100,
      calories: 98,
      proteinGrams: 14,
      carbsGrams: 3.5,
      fatGrams: 3.0,
      fiberGrams: 0,
    },
  ]);

  const handleAddIngredient = (preset: Omit<CustomRecipeIngredient, 'id'>) => {
    setIngredients((prev) => [
      ...prev,
      {
        ...preset,
        id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      },
    ]);
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const totals = useMemo(() => {
    const totalCalories = ingredients.reduce((acc, i) => acc + i.calories, 0);
    const totalProteinGrams =
      Math.round(ingredients.reduce((acc, i) => acc + i.proteinGrams, 0) * 10) / 10;
    const totalCarbsGrams =
      Math.round(ingredients.reduce((acc, i) => acc + i.carbsGrams, 0) * 10) / 10;
    const totalFatGrams =
      Math.round(ingredients.reduce((acc, i) => acc + i.fatGrams, 0) * 10) / 10;
    const totalFiberGrams =
      Math.round(ingredients.reduce((acc, i) => acc + (i.fiberGrams || 0), 0) * 10) / 10;
    const totalGrams = ingredients.reduce((acc, i) => acc + i.grams, 0);

    const safeServings = Math.max(1, servings);
    return {
      totalCalories,
      totalProteinGrams,
      totalCarbsGrams,
      totalFatGrams,
      totalFiberGrams,
      totalGrams,
      perServingCalories: Math.round(totalCalories / safeServings),
      perServingProtein: Math.round((totalProteinGrams / safeServings) * 10) / 10,
      perServingCarbs: Math.round((totalCarbsGrams / safeServings) * 10) / 10,
      perServingFat: Math.round((totalFatGrams / safeServings) * 10) / 10,
      perServingFiber: Math.round((totalFiberGrams / safeServings) * 10) / 10,
      perServingGrams: Math.round(totalGrams / safeServings),
    };
  }, [ingredients, servings]);

  const handleLogSavedRecipe = (recipe: CustomRecipe) => {
    const safeServings = Math.max(1, recipe.servings);
    addMeal({
      name: `👩‍🍳 ${recipe.title} (1 Porsiyon)`,
      portionGrams: Math.round(recipe.totalGrams / safeServings),
      mealType: selectedMealType,
      calories: Math.round(recipe.totalCalories / safeServings),
      proteinGrams: Math.round((recipe.totalProteinGrams / safeServings) * 10) / 10,
      carbsGrams: Math.round((recipe.totalCarbsGrams / safeServings) * 10) / 10,
      fatGrams: Math.round((recipe.totalFatGrams / safeServings) * 10) / 10,
      fiberGrams: Math.round((recipe.totalFiberGrams / safeServings) * 10) / 10,
      servingUnit: 'portion',
      servingCount: 1,
    });
    onClose();
  };

  const handleSaveAndLogNewRecipe = () => {
    if (!recipeTitle.trim() || ingredients.length === 0) return;

    addCustomRecipe({
      title: recipeTitle.trim(),
      servings: Math.max(1, servings),
      ingredients,
      totalCalories: totals.totalCalories,
      totalProteinGrams: totals.totalProteinGrams,
      totalCarbsGrams: totals.totalCarbsGrams,
      totalFatGrams: totals.totalFatGrams,
      totalFiberGrams: totals.totalFiberGrams,
      totalGrams: totals.totalGrams,
    });

    addMeal({
      name: `👩‍🍳 ${recipeTitle.trim()} (1 Porsiyon)`,
      portionGrams: totals.perServingGrams,
      mealType: selectedMealType,
      calories: totals.perServingCalories,
      proteinGrams: totals.perServingProtein,
      carbsGrams: totals.perServingCarbs,
      fatGrams: totals.perServingFat,
      fiberGrams: totals.perServingFiber,
      servingUnit: 'portion',
      servingCount: 1,
    });

    setActiveTab('saved');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeLabel}>WAISTLINE TARİF MOTORU</Text>
              <Text style={styles.title}>👩‍🍳 Özel Tarif & Porsiyonlayıcı</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sub-Tabs: Saved Recipes vs Create New */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
              onPress={() => setActiveTab('saved')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'saved' && styles.tabBtnTextActive]}>
                📖 Kayıtlı Tarifler ({customRecipes.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'create' && styles.tabBtnTextActive]}>
                ➕ Yeni Tarif Oluştur
              </Text>
            </TouchableOpacity>
          </View>

          {/* Meal Category Target Selector */}
          <View style={styles.mealCategoryRow}>
            {(
              [
                { type: 'breakfast', label: 'Kahvaltı', icon: '🌅' },
                { type: 'lunch', label: 'Öğle', icon: '☀️' },
                { type: 'dinner', label: 'Akşam', icon: '🌙' },
                { type: 'snack', label: 'Ara Öğün', icon: '🍏' },
              ] as { type: MealType; label: string; icon: string }[]
            ).map((m) => {
              const active = selectedMealType === m.type;
              return (
                <TouchableOpacity
                  key={m.type}
                  style={[styles.mealCatChip, active && styles.mealCatChipActive]}
                  onPress={() => setSelectedMealType(m.type)}
                >
                  <Text style={styles.mealCatChipText}>
                    {m.icon} {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {activeTab === 'saved' ? (
              <View style={{ gap: Spacing.md }}>
                {customRecipes.map((rec) => {
                  const s = Math.max(1, rec.servings);
                  const perCal = Math.round(rec.totalCalories / s);
                  const perProt = Math.round((rec.totalProteinGrams / s) * 10) / 10;
                  const perGrams = Math.round(rec.totalGrams / s);

                  return (
                    <View key={rec.id} style={styles.recipeCard}>
                      <View style={styles.recipeCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recipeTitle}>{rec.title}</Text>
                          <Text style={styles.recipeSubtitle}>
                            Toplam {rec.servings} Porsiyon • 1 Porsiyon ({perGrams}g): {perCal} kcal |{' '}
                            {perProt}g Protein
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeCustomRecipe(rec.id)}
                          style={styles.deleteMiniBtn}
                        >
                          <Text style={{ fontSize: 13 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.ingTagsWrap}>
                        {rec.ingredients.map((ing) => (
                          <View key={ing.id} style={styles.ingTag}>
                            <Text style={styles.ingTagText}>
                              {ing.name} ({ing.grams}g)
                            </Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={styles.logRecipeBtn}
                        onPress={() => handleLogSavedRecipe(rec)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.logRecipeBtnText}>
                          + 1 Porsiyon Günlüğe Ekle ({perCal} kcal)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View>
                {/* Recipe Name & Servings Row */}
                <Text style={styles.sectionLabel}>Tarif Adı & Porsiyon Sayısı</Text>
                <View style={styles.titleServingsRow}>
                  <TextInput
                    style={styles.titleInput}
                    value={recipeTitle}
                    onChangeText={setRecipeTitle}
                    placeholder="Örn: Ev Yapımı Mercimek Köftesi"
                    placeholderTextColor={theme.textPlaceholder}
                  />
                  <View style={styles.servingsStepper}>
                    <TouchableOpacity
                      style={styles.servBtn}
                      onPress={() => setServings((p) => Math.max(1, p - 1))}
                    >
                      <Text style={styles.servBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.servingsValue}>{servings} Pors.</Text>
                    <TouchableOpacity
                      style={styles.servBtn}
                      onPress={() => setServings((p) => Math.min(10, p + 1))}
                    >
                      <Text style={styles.servBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Add Ingredients */}
                <Text style={styles.sectionLabel}>Malzeme Ekle (Dokunarak Ekleyin)</Text>
                <View style={styles.presetsWrap}>
                  {INGREDIENT_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={styles.presetIngBtn}
                      onPress={() => handleAddIngredient(preset)}
                    >
                      <Text style={styles.presetIngText}>
                        + {preset.name} ({preset.grams}g)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Added Ingredients List */}
                <Text style={styles.sectionLabel}>
                  Tenceredeki Malzemeler ({ingredients.length})
                </Text>
                <View style={{ gap: 6, marginBottom: Spacing.md }}>
                  {ingredients.map((ing) => (
                    <View key={ing.id} style={styles.ingRowItem}>
                      <Text style={styles.ingRowName}>
                        {ing.name} ({ing.grams}g)
                      </Text>
                      <View style={styles.ingRowRight}>
                        <Text style={styles.ingRowCal}>{ing.calories} kcal</Text>
                        <TouchableOpacity onPress={() => handleRemoveIngredient(ing.id)}>
                          <Text style={styles.removeIngIcon}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Live Per-Serving Summary Banner */}
                <View style={styles.perServingBanner}>
                  <View>
                    <Text style={styles.perServingTitle}>
                      1 Porsiyon Besin Değeri ({totals.perServingGrams}g)
                    </Text>
                    <Text style={styles.perServingMacros}>
                      Protein: {totals.perServingProtein}g • Karb: {totals.perServingCarbs}g • Yağ:{' '}
                      {totals.perServingFat}g • Lif: {totals.perServingFiber}g
                    </Text>
                  </View>
                  <Text style={styles.perServingCal}>{totals.perServingCalories} kcal</Text>
                </View>

                <TouchableOpacity
                  style={styles.saveNewRecipeBtn}
                  onPress={handleSaveAndLogNewRecipe}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveNewRecipeBtnText}>
                    ✓ Tarifi Kaydet & 1 Porsiyon Ekle ({totals.perServingCalories} kcal)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
      maxHeight: '90%',
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.card,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    badgeLabel: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    title: {
      ...Typography.h2,
      color: theme.textPrimary,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnText: {
      ...Typography.bodyBold,
      color: theme.textSecondary,
    },
    tabRow: {
      flexDirection: 'row',
      backgroundColor: theme.surfaceSubtle,
      padding: 4,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.sm,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
    },
    tabBtnActive: {
      backgroundColor: theme.surface,
      ...Shadows.subtle,
    },
    tabBtnText: {
      ...Typography.captionBold,
      color: theme.textMuted,
    },
    tabBtnTextActive: {
      color: theme.primary,
    },
    mealCategoryRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: Spacing.sm,
    },
    mealCatChip: {
      flex: 1,
      paddingVertical: 6,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mealCatChipActive: {
      borderColor: theme.primary,
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
    },
    mealCatChipText: {
      ...Typography.tiny,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    scrollBody: {
      paddingVertical: Spacing.md,
    },
    recipeCard: {
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    recipeCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.xs,
    },
    recipeTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    recipeSubtitle: {
      ...Typography.tiny,
      color: theme.textSecondary,
      marginTop: 2,
    },
    deleteMiniBtn: {
      padding: 4,
    },
    ingTagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginVertical: Spacing.xs,
    },
    ingTag: {
      backgroundColor: theme.surface,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    ingTagText: {
      ...Typography.tiny,
      fontSize: 10,
      color: theme.textSecondary,
    },
    logRecipeBtn: {
      marginTop: Spacing.xs,
      backgroundColor: theme.primary,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    logRecipeBtnText: {
      ...Typography.captionBold,
      color: '#FFFFFF',
    },
    sectionLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: Spacing.sm,
      marginBottom: 6,
    },
    titleServingsRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      alignItems: 'center',
    },
    titleInput: {
      flex: 1,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      ...Typography.body,
      color: theme.textPrimary,
    },
    servingsStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 6,
      paddingVertical: 4,
      gap: 6,
    },
    servBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    servBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    servingsValue: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    presetsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    presetIngBtn: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    presetIngText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    ingRowItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    ingRowName: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    ingRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    ingRowCal: {
      ...Typography.tiny,
      color: theme.primary,
      fontWeight: '700',
    },
    removeIngIcon: {
      fontSize: 14,
      color: theme.danger,
      fontWeight: '700',
    },
    perServingBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1.5,
      borderColor: theme.primary,
      marginBottom: Spacing.md,
    },
    perServingTitle: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    perServingMacros: {
      ...Typography.tiny,
      color: theme.textSecondary,
      marginTop: 2,
    },
    perServingCal: {
      ...Typography.h2,
      color: theme.primary,
      fontWeight: '800',
    },
    saveNewRecipeBtn: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      ...Shadows.card,
    },
    saveNewRecipeBtnText: {
      ...Typography.bodyBold,
      color: '#FFFFFF',
    },
  });
