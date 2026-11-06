import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import { Colors, getThemeColors, ThemeColors } from '../../constants/colors';
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/theme';
import { FoodItemDetection, MealType } from '../../types';
import { MOCK_DETECTED_MEAL } from '../../constants/mockData';
import { useDietStore } from '../../store/useDietStore';
import { PortionSlider } from './PortionSlider';
import { matchUserAllergens } from '../../utils/allergenMatcher';

export interface LoggedMealPayload {
  name: string;
  portionGrams: number;
  mealType: MealType;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
  imageUrl?: string;
  allergens?: string[];
  warningMessage?: string;
}

interface FoodAnalysisModalProps {
  visible: boolean;
  imageUri: string | null;
  detectedFood?: FoodItemDetection;
  detectedFoods?: FoodItemDetection[];
  onClose: () => void;
  onConfirm?: (loggedData: LoggedMealPayload) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MEAL_OPTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: 'breakfast', label: 'Kahvaltı', icon: '🍳' },
  { type: 'lunch', label: 'Öğle', icon: '☀️' },
  { type: 'dinner', label: 'Akşam', icon: '🌙' },
  { type: 'snack', label: 'Ara Öğün', icon: '🍎' },
];

const ALTERNATIVE_DISAMBIGUATIONS: {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}[] = [
  { name: 'Izgara Tavuk Göğsü', grams: 180, calories: 297, protein: 55.8, carbs: 0, fat: 6.5 },
  { name: 'Fırında Hindi Bonfile', grams: 180, calories: 260, protein: 52.0, carbs: 0, fat: 4.8 },
  { name: 'Fırın Somon Fileto', grams: 180, calories: 340, protein: 38.0, carbs: 0, fat: 20.0 },
  { name: 'Izgara Hellim & Sebze', grams: 180, calories: 310, protein: 24.0, carbs: 8, fat: 21.0 },
];

interface EditablePlateItem {
  id: string;
  foodName: string;
  baseGrams: number;
  currentGrams: number;
  confidenceScore: number;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseFiber: number;
}

function buildInitialPlateItems(
  detectedFood?: FoodItemDetection,
  detectedFoods?: FoodItemDetection[],
  useMockData?: boolean
): EditablePlateItem[] {
  if (detectedFoods && detectedFoods.length > 0) {
    return detectedFoods.map((f, i) => ({
      id: f.id || `item-${i}`,
      foodName: f.foodName,
      baseGrams: f.portionGrams || 150,
      currentGrams: f.portionGrams || 150,
      confidenceScore: f.confidenceScore || 0.9,
      baseCalories: f.nutrition.calories,
      baseProtein: f.nutrition.proteinGrams,
      baseCarbs: f.nutrition.carbsGrams,
      baseFat: f.nutrition.fatGrams,
      baseFiber:
        f.nutrition.fiberGrams ??
        Math.round((f.nutrition.carbsGrams || 0) * 0.15 * 10) / 10,
    }));
  }

  if (detectedFood) {
    return [
      {
        id: detectedFood.id || 'item-1',
        foodName: detectedFood.foodName || MOCK_DETECTED_MEAL.foodName,
        baseGrams: detectedFood.portionGrams || 180,
        currentGrams: detectedFood.portionGrams || 180,
        confidenceScore: detectedFood.confidenceScore || 0.94,
        baseCalories: detectedFood.nutrition.calories ?? 297,
        baseProtein: detectedFood.nutrition.proteinGrams ?? 55.8,
        baseCarbs: detectedFood.nutrition.carbsGrams ?? 0,
        baseFat: detectedFood.nutrition.fatGrams ?? 6.5,
        baseFiber: detectedFood.nutrition.fiberGrams ?? 2.4,
      },
    ];
  }

  if (useMockData) {
    return [
      {
        id: 'item-1',
        foodName: 'Izgara Tavuk Göğsü',
        baseGrams: 180,
        currentGrams: 180,
        confidenceScore: 0.94,
        baseCalories: 297,
        baseProtein: 55.8,
        baseCarbs: 0,
        baseFat: 6.5,
        baseFiber: 0,
      },
      {
        id: 'item-2',
        foodName: 'Kinoa & Akdeniz Salatası',
        baseGrams: 150,
        currentGrams: 150,
        confidenceScore: 0.88,
        baseCalories: 185,
        baseProtein: 5.2,
        baseCarbs: 28.4,
        baseFat: 6.1,
        baseFiber: 4.8,
      },
    ];
  }

  return [];
}

const PIN_COORDINATES: { top: `${number}%`; left: `${number}%` }[] = [
  { top: '22%', left: '8%' },
  { top: '58%', left: '34%' },
  { top: '28%', left: '52%' },
];

export const FoodAnalysisModal: React.FC<FoodAnalysisModalProps> = ({
  visible,
  imageUri,
  detectedFood,
  detectedFoods,
  onClose,
  onConfirm,
}) => {
  const isDarkMode = useDietStore((state) => state.isDarkMode);
  const useMockData = useDietStore((state) => state.useMockData);
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  const addMeal = useDietStore((state) => state.addMeal);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [isSaved, setIsSaved] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [hasExtraSauce, setHasExtraSauce] = useState(false);

  // Initialize plate items (supports both single barcode items and multi-item AI plates)
  const [plateItems, setPlateItems] = useState<EditablePlateItem[]>(() =>
    buildInitialPlateItems(detectedFood, detectedFoods, useMockData)
  );

  const syncKey = `${visible}-${imageUri ?? ''}-${detectedFood?.id ?? ''}-${
    detectedFoods?.map((f) => f.id).join(',') ?? ''
  }`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (visible) {
      setIsSaved(false);
      setShowDisambiguation(false);
      setHasExtraSauce(false);
      setActiveItemIndex(0);
      setPlateItems(buildInitialPlateItems(detectedFood, detectedFoods, useMockData));
    }
  }

  const activeItem = plateItems[activeItemIndex] || plateItems[0];

  // Update current grams for the selected item on the plate
  const handleUpdateItemGrams = (newGrams: number) => {
    setPlateItems((prev) => {
      const updated = [...prev];
      if (updated[activeItemIndex]) {
        updated[activeItemIndex] = {
          ...updated[activeItemIndex],
          currentGrams: newGrams,
        };
      }
      return updated;
    });
  };

  // Swap active item name, base nutrition & default portion grams with an alternative choice
  const handleSelectAlternative = (alt: (typeof ALTERNATIVE_DISAMBIGUATIONS)[0]) => {
    const targetGrams = alt.grams ?? 180;
    setPlateItems((prev) => {
      const updated = [...prev];
      if (updated[activeItemIndex]) {
        updated[activeItemIndex] = {
          ...updated[activeItemIndex],
          foodName: alt.name,
          baseGrams: targetGrams,
          currentGrams: targetGrams,
          baseCalories: alt.calories,
          baseProtein: alt.protein,
          baseCarbs: alt.carbs,
          baseFat: alt.fat,
          confidenceScore: 0.96, // User explicitly confirmed
        };
      }
      return updated;
    });
    setShowDisambiguation(false);
  };

  // Calculate plate totals across all detected items
  const totalPlateCalories =
    plateItems.reduce((acc, item) => {
      const factor = item.currentGrams / (item.baseGrams > 0 ? item.baseGrams : 1);
      return acc + Math.round(item.baseCalories * factor);
    }, 0) + (hasExtraSauce ? 45 : 0);

  const totalPlateProtein =
    Math.round(
      plateItems.reduce((acc, item) => {
        const factor = item.currentGrams / (item.baseGrams > 0 ? item.baseGrams : 1);
        return acc + item.baseProtein * factor;
      }, 0) * 10
    ) / 10;

  const totalPlateCarbs =
    Math.round(
      plateItems.reduce((acc, item) => {
        const factor = item.currentGrams / (item.baseGrams > 0 ? item.baseGrams : 1);
        return acc + item.baseCarbs * factor;
      }, 0) * 10
    ) / 10;

  const totalPlateFat =
    Math.round(
      (plateItems.reduce((acc, item) => {
        const factor = item.currentGrams / (item.baseGrams > 0 ? item.baseGrams : 1);
        return acc + item.baseFat * factor;
      }, 0) +
        (hasExtraSauce ? 5.0 : 0)) *
        10
    ) / 10;

  const totalPlateFiber =
    Math.round(
      plateItems.reduce((acc, item) => {
        const factor = item.currentGrams / (item.baseGrams > 0 ? item.baseGrams : 1);
        return acc + item.baseFiber * factor;
      }, 0) * 10
    ) / 10;

  const totalPlateGrams = plateItems.reduce((acc, item) => acc + item.currentGrams, 0);

  const handleSaveMeal = () => {
    setIsSaved(true);

    const plateTitle = plateItems.map((p) => p.foodName).join(' + ');

    // Match allergens against userProfile using centralized matcher
    const userAllergies = useDietStore.getState().userProfile.allergies || [];
    const { matchedUserAllergies: detectedAllergens } = matchUserAllergens({
      foodText: plateTitle,
      userAllergies,
    });

    const mealPayload: LoggedMealPayload = {
      name: plateTitle,
      portionGrams: totalPlateGrams,
      mealType: selectedMealType,
      calories: totalPlateCalories,
      proteinGrams: totalPlateProtein,
      carbsGrams: totalPlateCarbs,
      fatGrams: totalPlateFat,
      fiberGrams: totalPlateFiber,
      imageUrl: imageUri || undefined,
      allergens: detectedAllergens.length > 0 ? detectedAllergens : undefined,
      warningMessage:
        detectedAllergens.length > 0
          ? `⚠️ ${detectedAllergens.join(', ')} Uyarısı`
          : undefined,
    };

    addMeal(mealPayload);

    if (onConfirm) {
      onConfirm(mealPayload);
      setIsSaved(false);
      onClose();
    } else {
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 700);
    }
  };

  if (!activeItem) {
    if (!visible) return null;
    return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropDismissArea}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.drawerContainer, { padding: Spacing.xl, alignItems: 'center' }]}>
            <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>🍽️</Text>
            <Text style={[styles.headerTitle, { textAlign: 'center' }]}>Tabak Verisi Bulunamadı</Text>
            <Text style={{ ...Typography.caption, color: theme.textMuted, textAlign: 'center', marginVertical: Spacing.md }}>
              Fotoğraftan yemek tespit edilemedi veya analiz sonucu yüklenemedi. Lütfen tekrar deneyin.
            </Text>
            <TouchableOpacity
              style={[styles.confirmButton, { width: '100%', marginTop: Spacing.md }]}
              onPress={onClose}
            >
              <Text style={styles.confirmButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const confidencePercent = Math.round((activeItem.confidenceScore || 0.9) * 100);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropDismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.drawerContainer}>
          <View style={styles.dragIndicatorWrapper}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeDot}>●</Text>
                <Text style={styles.headerBadgeText}>AI Çoklu Besin Motoru</Text>
              </View>
              <Text style={styles.headerTitle}>Tabağınız Analiz Edildi ✨</Text>
            </View>

            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Phase 3.2: Cal AI Interactive Food Pin Overlay on Captured Photo */}
            {imageUri && (
              <View style={styles.interactivePhotoWrapper}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.interactivePhoto}
                  resizeMode="cover"
                />
                <View style={styles.photoDimOverlay} />

                <View style={styles.photoTopHintBadge}>
                  <Text style={styles.photoTopHintText}>
                    🎯 Düzenlemek istediğiniz besin etiketine dokunun
                  </Text>
                </View>

                {plateItems.map((item, idx) => {
                  const isSelected = idx === activeItemIndex;
                  const coord = PIN_COORDINATES[idx % PIN_COORDINATES.length];
                  return (
                    <TouchableOpacity
                      key={`pin-${item.id}`}
                      style={[
                        styles.foodPinChip,
                        { top: coord.top, left: coord.left },
                        isSelected && styles.foodPinChipActive,
                      ]}
                      onPress={() => {
                        setActiveItemIndex(idx);
                        setShowDisambiguation(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.foodPinDot,
                          isSelected && { backgroundColor: '#FFFFFF' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.foodPinTitle,
                          isSelected && styles.foodPinTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {idx === 0 ? '🍗' : '🥗'} {item.foodName}
                      </Text>
                      <View
                        style={[
                          styles.foodPinGramPill,
                          isSelected && { backgroundColor: 'rgba(255,255,255,0.25)' },
                        ]}
                      >
                        <Text style={styles.foodPinGramText}>{item.currentGrams}g</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Multi-Item Plate Tabs (Allows adjusting individual items) */}
            {plateItems.length > 1 && (
              <View style={styles.plateItemsSection}>
                <Text style={styles.sectionSmallTitle}>
                  TABAĞINIZDAKİ YEMEKLER ({plateItems.length})
                </Text>
                <View style={styles.plateTabsRow}>
                  {plateItems.map((item, idx) => {
                    const isSelected = idx === activeItemIndex;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.plateTab, isSelected && styles.plateTabActive]}
                        onPress={() => {
                          setActiveItemIndex(idx);
                          setShowDisambiguation(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.plateTabText,
                            isSelected && styles.plateTabTextActive,
                          ]}
                        >
                          {idx === 0 ? '🍗' : '🥗'} {item.foodName} ({item.currentGrams}g)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Main Detected Food Overview Card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewTopRow}>
                <View style={styles.overviewInfo}>
                  <Text style={styles.foodNameText} numberOfLines={2}>
                    {activeItem.foodName}
                  </Text>

                  <View style={styles.tagsRow}>
                    <View
                      style={[
                        styles.confidenceTag,
                        confidencePercent < 75 && {
                          backgroundColor: '#FEF3C7',
                          borderColor: '#FDE68A',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.confidenceTagText,
                          confidencePercent < 75 && { color: '#B45309' },
                        ]}
                      >
                        {confidencePercent < 75 ? '⚠️' : '🛡️'} %{confidencePercent} Güven
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.disambiguateButton}
                      onPress={() => setShowDisambiguation(!showDisambiguation)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.disambiguateButtonText}>
                        {showDisambiguation ? 'Kapat' : 'Tahmin Yanlış mı? 🔍'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {imageUri && (
                  <View style={styles.thumbnailWrapper}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.thumbnailGlowBadge}>
                      <Text style={styles.thumbnailGlowText}>AI</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Low Confidence / Alternative Choice Disambiguation Drawer */}
              {showDisambiguation && (
                <View style={styles.disambiguationBox}>
                  <Text style={styles.disambiguationTitle}>
                    Emin olamadık; tabağınızdaki hangisi?
                  </Text>
                  <View style={styles.altButtonsCol}>
                    {ALTERNATIVE_DISAMBIGUATIONS.map((alt) => (
                      <TouchableOpacity
                        key={alt.name}
                        style={styles.altChoiceButton}
                        onPress={() => handleSelectAlternative(alt)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.altChoiceName}>• {alt.name}</Text>
                        <Text style={styles.altChoiceSub}>{alt.calories} kcal</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Calories Hero Banner for Entire Plate */}
              <View style={styles.caloriesBanner}>
                <View style={styles.caloriesLeft}>
                  <Text style={styles.caloriesLabel}>
                    Toplam Tabak Enerjisi ({totalPlateGrams}g)
                  </Text>
                  <Text style={styles.caloriesValue}>
                    {totalPlateCalories}{' '}
                    <Text style={styles.caloriesUnit}>kcal</Text>
                  </Text>
                </View>
                <View style={styles.calorieIconCircle}>
                  <Text style={styles.calorieIcon}>🔥</Text>
                </View>
              </View>

              {/* Macro Distribution for Entire Plate */}
              <View style={styles.macrosGrid}>
                <View
                  style={[
                    styles.macroCard,
                    { borderColor: isDarkMode ? '#1E3A8A' : Colors.proteinLight },
                  ]}
                >
                  <View
                    style={[
                      styles.macroPill,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(59, 130, 246, 0.2)'
                          : Colors.proteinLight,
                      },
                    ]}
                  >
                    <Text style={[styles.macroPillText, { color: theme.protein }]}>
                      Protein
                    </Text>
                  </View>
                  <Text style={styles.macroValue}>{totalPlateProtein}g</Text>
                </View>

                <View
                  style={[
                    styles.macroCard,
                    { borderColor: isDarkMode ? '#78350F' : Colors.carbsLight },
                  ]}
                >
                  <View
                    style={[
                      styles.macroPill,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(245, 158, 11, 0.2)'
                          : Colors.carbsLight,
                      },
                    ]}
                  >
                    <Text style={[styles.macroPillText, { color: theme.calories }]}>
                      Karb
                    </Text>
                  </View>
                  <Text style={styles.macroValue}>{totalPlateCarbs}g</Text>
                </View>

                <View
                  style={[
                    styles.macroCard,
                    { borderColor: isDarkMode ? '#831843' : Colors.fatLight },
                  ]}
                >
                  <View
                    style={[
                      styles.macroPill,
                      {
                        backgroundColor: isDarkMode
                          ? 'rgba(236, 72, 153, 0.2)'
                          : Colors.fatLight,
                      },
                    ]}
                  >
                    <Text style={[styles.macroPillText, { color: theme.fat }]}>
                      Yağ
                    </Text>
                  </View>
                  <Text style={styles.macroValue}>{totalPlateFat}g</Text>
                </View>

                <View
                  style={[
                    styles.macroCard,
                    { borderColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight },
                  ]}
                >
                  <View
                    style={[
                      styles.macroPill,
                      {
                        backgroundColor: isDarkMode
                          ? theme.primaryMuted
                          : Colors.primaryLight,
                      },
                    ]}
                  >
                    <Text style={[styles.macroPillText, { color: theme.primary }]}>
                      Lif
                    </Text>
                  </View>
                  <Text style={styles.macroValue}>{totalPlateFiber}g</Text>
                </View>
              </View>

              {/* Extra Sauce / Oil Addon Toggle */}
              <View style={styles.sauceToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sauceToggleTitle}>
                    🥣 Zeytinyağı / Salata Sosu (+45 kcal)
                  </Text>
                  <Text style={styles.sauceToggleSub}>
                    Tabağınızda ekstra zeytinyağı veya sos var mı?
                  </Text>
                </View>
                <Switch
                  value={hasExtraSauce}
                  onValueChange={setHasExtraSauce}
                  trackColor={{ false: theme.border, true: theme.primaryLight }}
                  thumbColor={hasExtraSauce ? theme.primary : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Individual Portion Slider for Active Item */}
            <PortionSlider
              value={activeItem.currentGrams}
              baseValue={activeItem.baseGrams}
              onChange={handleUpdateItemGrams}
            />

            {/* Meal Type Selector */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Hangi Öğün Olarak Eklensin?</Text>
              <View style={styles.mealOptionsRow}>
                {MEAL_OPTIONS.map((opt) => {
                  const isSelected = selectedMealType === opt.type;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      style={[
                        styles.mealOptionCard,
                        isSelected && styles.mealOptionCardActive,
                      ]}
                      onPress={() => setSelectedMealType(opt.type)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.mealOptionIcon}>{opt.icon}</Text>
                      <Text
                        style={[
                          styles.mealOptionLabel,
                          isSelected && styles.mealOptionLabelActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[styles.confirmButton, isSaved && styles.confirmButtonSuccess]}
              onPress={handleSaveMeal}
              disabled={isSaved}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmButtonText}>
                {isSaved
                  ? '✓ Günlüğe Kaydedildi!'
                  : `Tüm Tabağı Kaydet (${totalPlateCalories} kcal)`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: ThemeColors, isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    backdropDismissArea: {
      flex: 1,
    },
    drawerContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: BorderRadius.xxl,
      borderTopRightRadius: BorderRadius.xxl,
      maxHeight: SCREEN_HEIGHT * 0.92,
      paddingTop: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      ...Shadows.floating,
    },
    dragIndicatorWrapper: {
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    dragIndicator: {
      width: 44,
      height: 5,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: Spacing.md,
    },
    headerTextGroup: {
      flex: 1,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    headerBadgeDot: {
      fontSize: 8,
      color: theme.primary,
    },
    headerBadgeText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    headerTitle: {
      ...Typography.h2,
      color: theme.textPrimary,
    },
    closeIconButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeIconText: {
      fontSize: 16,
      color: theme.textSecondary,
      fontWeight: 'bold',
    },
    scrollContent: {
      paddingBottom: Spacing.xl,
    },
    interactivePhotoWrapper: {
      width: '100%',
      height: 155,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      marginBottom: Spacing.md,
      borderWidth: 1.5,
      borderColor: theme.border,
      position: 'relative',
    },
    interactivePhoto: {
      width: '100%',
      height: '100%',
    },
    photoDimOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.28)',
    },
    photoTopHintBadge: {
      position: 'absolute',
      top: 8,
      left: 10,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    photoTopHintText: {
      ...Typography.tiny,
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    foodPinChip: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: BorderRadius.full,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      maxWidth: '82%',
      ...Shadows.card,
    },
    foodPinChipActive: {
      backgroundColor: Colors.primary,
      borderColor: '#FFFFFF',
    },
    foodPinDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.primary,
      marginRight: 5,
    },
    foodPinTitle: {
      ...Typography.tiny,
      color: '#FFFFFF',
      fontWeight: '700',
      marginRight: 6,
    },
    foodPinTitleActive: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    foodPinGramPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: BorderRadius.full,
    },
    foodPinGramText: {
      ...Typography.tiny,
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    plateItemsSection: {
      marginBottom: Spacing.sm,
    },
    sectionSmallTitle: {
      ...Typography.tiny,
      fontWeight: '700',
      color: theme.textMuted,
      marginBottom: Spacing.xs,
      letterSpacing: 0.5,
    },
    plateTabsRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    plateTab: {
      flex: 1,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
    },
    plateTabActive: {
      backgroundColor: isDarkMode ? theme.primaryMuted : '#ECFDF5',
      borderColor: theme.primary,
    },
    plateTabText: {
      ...Typography.tiny,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    plateTabTextActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    overviewCard: {
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      ...Shadows.card,
      marginBottom: Spacing.md,
    },
    overviewTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    overviewInfo: {
      flex: 1,
      paddingRight: Spacing.sm,
    },
    foodNameText: {
      ...Typography.h3,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      alignItems: 'center',
    },
    confidenceTag: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: isDarkMode ? theme.primary : Colors.primaryMuted,
    },
    confidenceTagText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    disambiguateButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
    },
    disambiguateButtonText: {
      ...Typography.tiny,
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '600',
    },
    disambiguationBox: {
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
      borderRadius: BorderRadius.lg,
      padding: Spacing.sm,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
    },
    disambiguationTitle: {
      ...Typography.tiny,
      fontWeight: '700',
      color: isDarkMode ? '#FCD34D' : '#92400E',
      marginBottom: Spacing.xs,
    },
    altButtonsCol: {
      gap: 4,
    },
    altChoiceButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      paddingHorizontal: Spacing.sm,
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.sm,
    },
    altChoiceName: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    altChoiceSub: {
      ...Typography.tiny,
      color: theme.calories,
      fontWeight: '700',
    },
    thumbnailWrapper: {
      position: 'relative',
      width: 60,
      height: 60,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.primary,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    thumbnailGlowBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.xs,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    thumbnailGlowText: {
      fontSize: 9,
      fontWeight: 'bold',
      color: Colors.textInverse,
    },
    caloriesBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceSubtle,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
    },
    caloriesLeft: {
      flex: 1,
    },
    caloriesLabel: {
      ...Typography.tiny,
      color: theme.textMuted,
      fontWeight: '600',
    },
    caloriesValue: {
      ...Typography.h1,
      color: theme.primary,
    },
    caloriesUnit: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    calorieIconCircle: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : Colors.caloriesLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calorieIcon: {
      fontSize: 22,
    },
    macrosGrid: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    macroCard: {
      flex: 1,
      backgroundColor: theme.surfaceSubtle,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
    },
    macroPill: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
      marginBottom: 4,
    },
    macroPillText: {
      ...Typography.tiny,
      fontWeight: '700',
    },
    macroValue: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    sauceToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Spacing.sm,
      marginTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    sauceToggleTitle: {
      ...Typography.captionBold,
      color: theme.textPrimary,
    },
    sauceToggleSub: {
      ...Typography.tiny,
      color: theme.textMuted,
      marginTop: 2,
    },
    sectionBox: {
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      ...Typography.bodyBold,
      color: theme.textPrimary,
      marginBottom: Spacing.xs,
    },
    mealOptionsRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    mealOptionCard: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.surfaceSubtle,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    mealOptionCardActive: {
      backgroundColor: isDarkMode ? theme.primaryMuted : Colors.primaryLight,
      borderColor: theme.primary,
    },
    mealOptionIcon: {
      fontSize: 18,
      marginBottom: 2,
    },
    mealOptionLabel: {
      ...Typography.tiny,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    mealOptionLabelActive: {
      color: isDarkMode ? theme.primary : Colors.primaryDark,
      fontWeight: '700',
    },
    confirmButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.xs,
      marginBottom: Spacing.md,
      ...Shadows.card,
    },
    confirmButtonSuccess: {
      backgroundColor: Colors.primaryDark,
    },
    confirmButtonText: {
      ...Typography.bodyBold,
      color: Colors.textInverse,
      fontSize: 16,
    },
  });
