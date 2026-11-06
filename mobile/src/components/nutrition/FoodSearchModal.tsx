import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { MealType } from '../../types';
import { useDietStore } from '../../store/useDietStore';
import { matchUserAllergens } from '../../utils/allergenMatcher';

export interface SearchFoodItem {
  id: string;
  name: string;
  category: 'breakfast' | 'main' | 'salad' | 'snack' | 'drink';
  categoryLabel: string;
  defaultGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  icon: string;
}

const COMMON_TURKISH_FOODS: SearchFoodItem[] = [
  // Kahvaltılık
  {
    id: 'tk-1',
    name: 'Haşlanmış Yumurta',
    category: 'breakfast',
    categoryLabel: 'Kahvaltılık',
    defaultGrams: 55,
    caloriesPer100g: 155,
    proteinPer100g: 13.0,
    carbsPer100g: 1.1,
    fatPer100g: 11.0,
    fiberPer100g: 0,
    icon: '🥚',
  },
  {
    id: 'tk-2',
    name: 'Tam Yağlı Beyaz Peynir',
    category: 'breakfast',
    categoryLabel: 'Kahvaltılık',
    defaultGrams: 40,
    caloriesPer100g: 260,
    proteinPer100g: 16.0,
    carbsPer100g: 2.0,
    fatPer100g: 21.0,
    fiberPer100g: 0,
    icon: '🧀',
  },
  {
    id: 'tk-3',
    name: 'Yağsız Lor Peyniri',
    category: 'breakfast',
    categoryLabel: 'Kahvaltılık',
    defaultGrams: 75,
    caloriesPer100g: 98,
    proteinPer100g: 17.5,
    carbsPer100g: 3.2,
    fatPer100g: 1.5,
    fiberPer100g: 0,
    icon: '🥣',
  },
  {
    id: 'tk-4',
    name: 'Siyah Zeytin',
    category: 'breakfast',
    categoryLabel: 'Kahvaltılık',
    defaultGrams: 25,
    caloriesPer100g: 115,
    proteinPer100g: 0.8,
    carbsPer100g: 6.3,
    fatPer100g: 10.7,
    fiberPer100g: 3.2,
    icon: '🫒',
  },
  {
    id: 'tk-5',
    name: 'Yulaf Ezmesi',
    category: 'breakfast',
    categoryLabel: 'Kahvaltılık',
    defaultGrams: 50,
    caloriesPer100g: 370,
    proteinPer100g: 13.0,
    carbsPer100g: 64.0,
    fatPer100g: 7.0,
    fiberPer100g: 10.0,
    icon: '🌾',
  },
  {
    id: 'tk-6',
    name: 'Tam Buğday Ekmeği (1 Dilim)',
    category: 'breakfast',
    categoryLabel: 'Kahvaltılık',
    defaultGrams: 30,
    caloriesPer100g: 247,
    proteinPer100g: 12.0,
    carbsPer100g: 41.0,
    fatPer100g: 3.4,
    fiberPer100g: 7.0,
    icon: '🍞',
  },

  // Ana Yemekler
  {
    id: 'tk-7',
    name: 'Kırmızı Mercimek Çorbası',
    category: 'main',
    categoryLabel: 'Çorbalar',
    defaultGrams: 220,
    caloriesPer100g: 65,
    proteinPer100g: 3.8,
    carbsPer100g: 9.8,
    fatPer100g: 1.4,
    fiberPer100g: 1.6,
    icon: '🍲',
  },
  {
    id: 'tk-8',
    name: 'Izgara Tavuk Göğsü',
    category: 'main',
    categoryLabel: 'Ana Yemek',
    defaultGrams: 180,
    caloriesPer100g: 165,
    proteinPer100g: 31.0,
    carbsPer100g: 0.0,
    fatPer100g: 3.6,
    fiberPer100g: 0,
    icon: '🍗',
  },
  {
    id: 'tk-9',
    name: 'Izgara Köfte (Anne Köftesi)',
    category: 'main',
    categoryLabel: 'Ana Yemek',
    defaultGrams: 160,
    caloriesPer100g: 225,
    proteinPer100g: 19.5,
    carbsPer100g: 5.2,
    fatPer100g: 14.0,
    fiberPer100g: 0.6,
    icon: '🥩',
  },
  {
    id: 'tk-10',
    name: 'Zeytinyağlı Kuru Fasulye',
    category: 'main',
    categoryLabel: 'Ana Yemek',
    defaultGrams: 200,
    caloriesPer100g: 110,
    proteinPer100g: 7.0,
    carbsPer100g: 15.0,
    fatPer100g: 2.8,
    fiberPer100g: 5.4,
    icon: '🍛',
  },
  {
    id: 'tk-11',
    name: 'Fırında Somon Fileto',
    category: 'main',
    categoryLabel: 'Ana Yemek',
    defaultGrams: 180,
    caloriesPer100g: 208,
    proteinPer100g: 20.0,
    carbsPer100g: 0.0,
    fatPer100g: 13.0,
    fiberPer100g: 0,
    icon: '🐟',
  },
  {
    id: 'tk-12',
    name: 'Bulgur Pilavı',
    category: 'main',
    categoryLabel: 'Pilav & Tahıl',
    defaultGrams: 150,
    caloriesPer100g: 145,
    proteinPer100g: 3.5,
    carbsPer100g: 28.0,
    fatPer100g: 2.1,
    fiberPer100g: 3.2,
    icon: '🍚',
  },

  // Sebze & Salata
  {
    id: 'tk-13',
    name: 'Akdeniz Yeşillikleri & Zeytinyağlı Salata',
    category: 'salad',
    categoryLabel: 'Salatalar',
    defaultGrams: 150,
    caloriesPer100g: 52,
    proteinPer100g: 1.4,
    carbsPer100g: 3.2,
    fatPer100g: 4.1,
    fiberPer100g: 2.0,
    icon: '🥗',
  },
  {
    id: 'tk-14',
    name: 'Zeytinyağlı Taze Fasulye',
    category: 'salad',
    categoryLabel: 'Zeytinyağlı',
    defaultGrams: 180,
    caloriesPer100g: 68,
    proteinPer100g: 1.8,
    carbsPer100g: 6.5,
    fatPer100g: 4.0,
    fiberPer100g: 2.9,
    icon: '🥬',
  },
  {
    id: 'tk-15',
    name: 'Buharda Brokoli & Havuç',
    category: 'salad',
    categoryLabel: 'Sebze',
    defaultGrams: 150,
    caloriesPer100g: 35,
    proteinPer100g: 2.4,
    carbsPer100g: 6.0,
    fatPer100g: 0.4,
    fiberPer100g: 2.6,
    icon: '🥦',
  },

  // Atıştırmalık & Meyve
  {
    id: 'tk-16',
    name: 'Süzme Yoğurt',
    category: 'snack',
    categoryLabel: 'Süt Ürünü',
    defaultGrams: 150,
    caloriesPer100g: 97,
    proteinPer100g: 9.0,
    carbsPer100g: 3.9,
    fatPer100g: 5.0,
    fiberPer100g: 0,
    icon: '🥣',
  },
  {
    id: 'tk-17',
    name: 'Yeşil Elma',
    category: 'snack',
    categoryLabel: 'Meyve',
    defaultGrams: 140,
    caloriesPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 14.0,
    fatPer100g: 0.2,
    fiberPer100g: 2.4,
    icon: '🍏',
  },
  {
    id: 'tk-18',
    name: 'Muz (Orta Boy)',
    category: 'snack',
    categoryLabel: 'Meyve',
    defaultGrams: 120,
    caloriesPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 23.0,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
    icon: '🍌',
  },
  {
    id: 'tk-19',
    name: 'Çiğ Badem (1 Avuç)',
    category: 'snack',
    categoryLabel: 'Kuruyemiş',
    defaultGrams: 25,
    caloriesPer100g: 579,
    proteinPer100g: 21.0,
    carbsPer100g: 22.0,
    fatPer100g: 50.0,
    fiberPer100g: 12.5,
    icon: '🥜',
  },
  {
    id: 'tk-20',
    name: 'Ceviz İçi (4 Adet)',
    category: 'snack',
    categoryLabel: 'Kuruyemiş',
    defaultGrams: 20,
    caloriesPer100g: 654,
    proteinPer100g: 15.0,
    carbsPer100g: 14.0,
    fatPer100g: 65.0,
    fiberPer100g: 6.7,
    icon: '🌰',
  },
];

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  initialMealType?: MealType;
}

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({
  visible,
  onClose,
  initialMealType = 'lunch',
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const addMeal = useDietStore((state) => state.addMeal);
  const userProfile = useDietStore((state) => state.userProfile);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<SearchFoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState<number>(100);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<SearchFoodItem[]>([]);

  // Synchronize mealType when modal opens or initialMealType changes
  const [prevSyncKey, setPrevSyncKey] = useState(`${visible}-${initialMealType}`);
  const currentSyncKey = `${visible}-${initialMealType}`;
  if (currentSyncKey !== prevSyncKey) {
    setPrevSyncKey(currentSyncKey);
    if (visible) {
      setMealType(initialMealType);
    }
  }

  // Filter local Turkish foods
  const filteredLocalFoods = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COMMON_TURKISH_FOODS;
    return COMMON_TURKISH_FOODS.filter(
      (f) => f.name.toLowerCase().includes(q) || f.categoryLabel.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Combined list
  const displayItems = useMemo(() => {
    return [...filteredLocalFoods, ...onlineResults];
  }, [filteredLocalFoods, onlineResults]);

  // Online search query to Open Food Facts
  const handleOnlineSearch = async () => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return;

    setIsSearchingOnline(true);
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        q
      )}&search_simple=1&action=process&json=1&page_size=6&fields=product_name,product_name_tr,brands,nutriments,serving_quantity`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          const mapped: SearchFoodItem[] = data.products
            .filter((p: any) => p.product_name || p.product_name_tr)
            .map((p: any, idx: number) => {
              const name = p.product_name_tr || p.product_name;
              const brand = p.brands ? `${p.brands} - ` : '';
              const n = p.nutriments || {};
              const rawCal = n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 150;
              const cal = Math.round(Number.isFinite(Number(rawCal)) ? Number(rawCal) : 150);
              const prot = Math.round((n['proteins_100g'] ?? 0) * 10) / 10;
              const carbs = Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10;
              const fat = Math.round((n['fat_100g'] ?? 0) * 10) / 10;
              const fiber = n['fiber_100g'] ? Math.round(n['fiber_100g'] * 10) / 10 : undefined;

              return {
                id: `online-${idx}-${Date.now()}`,
                name: `${brand}${name}`.slice(0, 40),
                category: 'snack',
                categoryLabel: 'Online Sonuç',
                defaultGrams: p.serving_quantity ? Math.round(Number(p.serving_quantity)) : 100,
                caloriesPer100g: cal,
                proteinPer100g: prot,
                carbsPer100g: carbs,
                fatPer100g: fat,
                fiberPer100g: fiber,
                icon: '📦',
              };
            });
          setOnlineResults(mapped);
        }
      }
    } catch {
      // Fallback gracefully without throwing
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleSelectFood = (item: SearchFoodItem) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedFood(item);
    setPortionGrams(item.defaultGrams);
  };

  // Calculated nutrition for selected item & grams
  const computedNutrition = useMemo(() => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const ratio = portionGrams / 100;
    return {
      calories: Math.round(selectedFood.caloriesPer100g * ratio),
      protein: Math.round(selectedFood.proteinPer100g * ratio * 10) / 10,
      carbs: Math.round(selectedFood.carbsPer100g * ratio * 10) / 10,
      fat: Math.round(selectedFood.fatPer100g * ratio * 10) / 10,
      fiber: selectedFood.fiberPer100g
        ? Math.round(selectedFood.fiberPer100g * ratio * 10) / 10
        : undefined,
    };
  }, [selectedFood, portionGrams]);

  const handleConfirmAdd = () => {
    if (!selectedFood) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const userAllergies = userProfile?.allergies || [];
    const allergenCheck = matchUserAllergens({
      foodText: `${selectedFood.name} ${selectedFood.categoryLabel}`,
      userAllergies,
    });

    addMeal({
      name: `${selectedFood.icon} ${selectedFood.name}`,
      portionGrams,
      mealType,
      calories: computedNutrition.calories,
      proteinGrams: computedNutrition.protein,
      carbsGrams: computedNutrition.carbs,
      fatGrams: computedNutrition.fat,
      fiberGrams: computedNutrition.fiber,
      servingCount: 1,
      servingUnit: 'g',
      allergens:
        allergenCheck.matchedUserAllergies.length > 0
          ? allergenCheck.matchedUserAllergies
          : undefined,
      warningMessage:
        allergenCheck.matchedUserAllergies.length > 0
          ? `Alerjen Uyarısı: ${allergenCheck.matchedUserAllergies.join(', ')}`
          : undefined,
    });

    setSelectedFood(null);
    setSearchQuery('');
    setOnlineResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.badgeText}>MANUEL BESİN ARAMA</Text>
              <Text style={styles.headerTitle}>🔍 Gıda Veritabanı & Ekleme</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input Bar */}
          <View style={styles.searchBarContainer}>
            <Text style={styles.searchIcon}>🔎</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Yemek, meyve veya paketli ürün ara..."
              placeholderTextColor={theme.textPlaceholder}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (onlineResults.length > 0) setOnlineResults([]);
              }}
              onSubmitEditing={handleOnlineSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Meal Type Selector */}
          <View style={styles.mealTypeRow}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
              const labels: Record<MealType, string> = {
                breakfast: 'Kahvaltı 🍳',
                lunch: 'Öğle ☀️',
                dinner: 'Akşam 🌙',
                snack: 'Ara Öğün 🍎',
              };
              const isSelected = mealType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.mealTypeChip, isSelected && styles.mealTypeChipActive]}
                  onPress={() => setMealType(type)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.mealTypeChipText, isSelected && styles.mealTypeChipTextActive]}
                  >
                    {labels[type]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Food List */}
          <FlatList
            data={displayItems}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedFood?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.foodRow, isSelected && styles.foodRowSelected]}
                  onPress={() => handleSelectFood(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.foodIcon}>{item.icon}</Text>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.foodCategory}>{item.categoryLabel}</Text>
                  </View>
                  <View style={styles.foodMacroPill}>
                    <Text style={styles.foodCalorieText}>
                      {item.caloriesPer100g} <Text style={{ fontSize: 10 }}>kcal/100g</Text>
                    </Text>
                    <Text style={styles.foodMacroSummary}>
                      P:{item.proteinPer100g}g • K:{item.carbsPer100g}g • Y:{item.fatPer100g}g
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              searchQuery.trim().length >= 2 ? (
                <TouchableOpacity
                  style={styles.onlineSearchButton}
                  onPress={handleOnlineSearch}
                  disabled={isSearchingOnline}
                  activeOpacity={0.8}
                >
                  {isSearchingOnline ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Text style={styles.onlineSearchButtonText}>
                      {`🌐 Open Food Facts'te "${searchQuery}" Ara`}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : undefined
            }
          />

          {/* Selected Food & Portion Tuning Sheet */}
          {selectedFood && (
            <View style={styles.portionSheet}>
              <View style={styles.portionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.portionFoodName}>
                    {selectedFood.icon} {selectedFood.name}
                  </Text>
                  <Text style={styles.portionMacroDetail}>
                    Protein: {computedNutrition.protein}g • Karb: {computedNutrition.carbs}g • Yağ:{' '}
                    {computedNutrition.fat}g
                  </Text>
                </View>
                <Text style={styles.portionCalories}>{computedNutrition.calories} kcal</Text>
              </View>

              {/* Gram Stepper */}
              <View style={styles.gramsStepperRow}>
                <Text style={styles.gramsLabel}>Porsiyon Gramajı:</Text>
                <View style={styles.stepperControls}>
                  {[50, 100, 150, 200, 300].map((quickGrams) => {
                    const isQuickSelected = portionGrams === quickGrams;
                    return (
                      <TouchableOpacity
                        key={quickGrams}
                        style={[styles.quickGramBtn, isQuickSelected && styles.quickGramBtnActive]}
                        onPress={() => setPortionGrams(quickGrams)}
                      >
                        <Text
                          style={[
                            styles.quickGramText,
                            isQuickSelected && styles.quickGramTextActive,
                          ]}
                        >
                          {quickGrams}g
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Add Button */}
              <TouchableOpacity
                style={styles.confirmAddBtn}
                onPress={handleConfirmAdd}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmAddBtnText}>
                  ✓ Günlüğe Ekle ({portionGrams}g • {computedNutrition.calories} kcal)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: BorderRadius.xxl,
      borderTopRightRadius: BorderRadius.xxl,
      maxHeight: '90%',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.xl,
      ...Shadows.floating,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    badgeText: {
      ...Typography.tiny,
      color: theme.primary,
      fontWeight: '700',
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    headerTitle: {
      ...Typography.h3,
      color: theme.textPrimary,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnText: {
      color: theme.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },
    searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
    },
    searchIcon: {
      fontSize: 16,
      marginRight: Spacing.xs,
    },
    searchInput: {
      flex: 1,
      height: 44,
      ...Typography.body,
      color: theme.textPrimary,
    },
    clearSearchBtn: {
      padding: Spacing.xs,
    },
    clearSearchText: {
      color: theme.textMuted,
      fontSize: 14,
    },
    mealTypeRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    mealTypeChip: {
      flex: 1,
      paddingVertical: Spacing.xs,
      paddingHorizontal: 4,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    mealTypeChipActive: {
      backgroundColor: theme.primaryMuted,
      borderColor: theme.primary,
    },
    mealTypeChipText: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontWeight: '600',
    },
    mealTypeChipTextActive: {
      color: theme.primaryDark || theme.primary,
      fontWeight: '700',
    },
    listContent: {
      paddingBottom: Spacing.md,
    },
    foodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.xs,
    },
    foodRowSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryMuted,
    },
    foodIcon: {
      fontSize: 24,
      marginRight: Spacing.md,
    },
    foodInfo: {
      flex: 1,
      marginRight: Spacing.sm,
    },
    foodName: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    foodCategory: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    foodMacroPill: {
      alignItems: 'flex-end',
    },
    foodCalorieText: {
      ...Typography.bodyBold,
      color: theme.calories || Colors.calories,
    },
    foodMacroSummary: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontSize: 10,
    },
    onlineSearchButton: {
      paddingVertical: Spacing.md,
      alignItems: 'center',
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: Spacing.xs,
    },
    onlineSearchButtonText: {
      ...Typography.captionBold,
      color: theme.primary,
    },
    portionSheet: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    portionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    portionFoodName: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
    },
    portionMacroDetail: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    portionCalories: {
      ...Typography.h2,
      color: theme.calories || Colors.calories,
    },
    gramsStepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    gramsLabel: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    stepperControls: {
      flexDirection: 'row',
      gap: 6,
    },
    quickGramBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickGramBtnActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    quickGramText: {
      ...Typography.tiny,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    quickGramTextActive: {
      color: theme.textInverse,
      fontWeight: '700',
    },
    confirmAddBtn: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
      alignItems: 'center',
      ...Shadows.card,
    },
    confirmAddBtnText: {
      ...Typography.bodyBold,
      color: theme.textInverse,
    },
  });
