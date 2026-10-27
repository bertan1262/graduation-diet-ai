import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  LoggedMealItem,
  PendingMealAnalysis,
  RecognitionResponse,
  CustomRecipe,
  ProgressPhotoEntry,
  WeeklyWeightEntry,
} from '../types';
import {
  DEFAULT_USER_PROFILE,
  INITIAL_TODAY_MEALS,
  INITIAL_CUSTOM_RECIPES,
  INITIAL_PROGRESS_PHOTOS,
  INITIAL_WEEKLY_WEIGHT_LOGS,
} from '../constants/mockData';

export interface DailySummary {
  totalCalories: number;
  remainingCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  calorieProgressPercent: number;
  waterProgressPercent: number;
  healthScore: number;
  healthScoreLabel: string;
}

interface DietStoreState {
  userProfile: UserProfile;
  todayMeals: LoggedMealItem[];
  waterIntakeMl: number;
  streakDays: number;
  pendingAnalysis: PendingMealAnalysis;
  customRecipes: CustomRecipe[];
  progressPhotos: ProgressPhotoEntry[];
  weeklyWeightLogs: WeeklyWeightEntry[];
  useMockData: boolean;
  isDarkMode: boolean;
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  lastActiveDate: string;

  // Actions
  addMeal: (meal: Omit<LoggedMealItem, 'id' | 'loggedAt'>) => void;
  updateMeal: (id: string, updatedFields: Partial<LoggedMealItem>) => void;
  removeMeal: (id: string) => void;
  addWater: (amountMl?: number) => void;
  resetWater: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setUseMockData: (enabled: boolean) => void;
  resetDay: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  setHasHydrated: (state: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  checkAndRollOverDay: () => void;

  // Phase 3 & 4 Actions (Cal AI Background Analysis, Waistline Recipes, Progress Photos)
  startBackgroundAnalysis: (
    imageUri: string,
    analysisPromise: Promise<RecognitionResponse | void>
  ) => void;
  clearPendingAnalysis: () => void;
  addCustomRecipe: (recipe: Omit<CustomRecipe, 'id'>) => void;
  removeCustomRecipe: (id: string) => void;
  addProgressPhoto: (photo: Omit<ProgressPhotoEntry, 'id'>) => void;
  addWeeklyWeightLog: (newWeightKg: number) => void;
  markWeeklyLogCalibrated: (logId: string, newTargetCalories: number) => void;

  // Computed helper
  getDailySummary: () => DailySummary;
}

export const useDietStore = create<DietStoreState>()(
  persist(
    (set, get) => ({
      userProfile: DEFAULT_USER_PROFILE,
      todayMeals: INITIAL_TODAY_MEALS,
      waterIntakeMl: 1250,
      streakDays: 5,
      pendingAnalysis: { status: 'idle' },
      customRecipes: INITIAL_CUSTOM_RECIPES,
      progressPhotos: INITIAL_PROGRESS_PHOTOS,
      weeklyWeightLogs: INITIAL_WEEKLY_WEIGHT_LOGS,
      useMockData: true,
      isDarkMode: false,
      hasHydrated: false,
      hasCompletedOnboarding: false,
      lastActiveDate: new Intl.DateTimeFormat('en-CA').format(new Date()),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (enabled) => set({ isDarkMode: enabled }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),

      checkAndRollOverDay: () => {
        const todayDate = new Intl.DateTimeFormat('en-CA').format(new Date());
        const { lastActiveDate, todayMeals, streakDays } = get();

        // If app rolls over to a new calendar date, clear today's meal and water trackers
        if (lastActiveDate && lastActiveDate !== todayDate) {
          const nextStreak = todayMeals.length > 0 ? streakDays + 1 : 1;
          set({
            todayMeals: [],
            waterIntakeMl: 0,
            streakDays: nextStreak,
            lastActiveDate: todayDate,
          });
        } else if (!lastActiveDate) {
          set({ lastActiveDate: todayDate });
        }
      },

      addMeal: (newMeal) => {
        get().checkAndRollOverDay();

        const timeNow = new Intl.DateTimeFormat('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date());

        // Estimate micronutrients if not explicitly provided
        const estimatedFiber =
          newMeal.fiberGrams !== undefined
            ? newMeal.fiberGrams
            : Math.round((newMeal.carbsGrams || 0) * 0.14 * 10) / 10;
        const estimatedSugar =
          newMeal.sugarGrams !== undefined
            ? newMeal.sugarGrams
            : Math.round((newMeal.carbsGrams || 0) * 0.11 * 10) / 10;
        const estimatedSodium =
          newMeal.sodiumMg !== undefined
            ? newMeal.sodiumMg
            : Math.round((newMeal.calories || 100) * 1.1);

        const createdItem: LoggedMealItem = {
          ...newMeal,
          fiberGrams: estimatedFiber,
          sugarGrams: estimatedSugar,
          sodiumMg: estimatedSodium,
          id: `meal-${Date.now()}`,
          loggedAt: timeNow,
        };

        set((state) => ({
          todayMeals: [createdItem, ...state.todayMeals],
        }));
      },

      updateMeal: (id, updatedFields) => {
        set((state) => ({
          todayMeals: state.todayMeals.map((m) =>
            m.id === id ? { ...m, ...updatedFields } : m
          ),
        }));
      },

      removeMeal: (id) => {
        set((state) => ({
          todayMeals: state.todayMeals.filter((m) => m.id !== id),
        }));
      },

      addWater: (amountMl = 250) => {
        get().checkAndRollOverDay();

        set((state) => ({
          waterIntakeMl: Math.max(0, state.waterIntakeMl + amountMl),
        }));
      },

      resetWater: () => {
        set({ waterIntakeMl: 0 });
      },

      updateProfile: (updatedFields) => {
        set((state) => ({
          userProfile: { ...state.userProfile, ...updatedFields },
        }));
      },

      setUseMockData: (enabled) => {
        set({ useMockData: enabled });
      },

      resetDay: () => {
        const todayDate = new Intl.DateTimeFormat('en-CA').format(new Date());
        set({
          todayMeals: [],
          waterIntakeMl: 0,
          lastActiveDate: todayDate,
        });
      },

      startBackgroundAnalysis: (imageUri, analysisPromise) => {
        set({
          pendingAnalysis: {
            status: 'analyzing',
            imageUri,
            startedAt: Date.now(),
          },
        });

        analysisPromise
          .then((res) => {
            if (res && res.detectedFoods && res.detectedFoods.length > 0) {
              set({
                pendingAnalysis: {
                  status: 'ready',
                  imageUri,
                  detectedFood: res.detectedFoods[0],
                  detectedFoods: res.detectedFoods,
                },
              });
            } else {
              // Fallback multi-item plate if mock or empty
              set({
                pendingAnalysis: {
                  status: 'ready',
                  imageUri,
                  detectedFoods: [
                    {
                      id: 'bg-item-1',
                      foodName: 'Izgara Tavuk Göğsü',
                      portionGrams: 180,
                      confidenceScore: 0.95,
                      nutrition: {
                        calories: 297,
                        proteinGrams: 55.8,
                        carbsGrams: 0,
                        fatGrams: 6.5,
                        fiberGrams: 0,
                        sugarGrams: 0,
                        sodiumMg: 340,
                      },
                    },
                    {
                      id: 'bg-item-2',
                      foodName: 'Kinoa & Akdeniz Salatası',
                      portionGrams: 150,
                      confidenceScore: 0.89,
                      nutrition: {
                        calories: 185,
                        proteinGrams: 5.2,
                        carbsGrams: 28.4,
                        fatGrams: 6.1,
                        fiberGrams: 4.8,
                        sugarGrams: 2.4,
                        sodiumMg: 210,
                      },
                    },
                  ],
                },
              });
            }
          })
          .catch(() => {
            set({
              pendingAnalysis: {
                status: 'ready',
                imageUri,
              },
            });
          });
      },

      clearPendingAnalysis: () => {
        set({ pendingAnalysis: { status: 'idle' } });
      },

      addCustomRecipe: (recipe) => {
        const created: CustomRecipe = {
          ...recipe,
          id: `recipe-${Date.now()}`,
        };
        set((state) => ({
          customRecipes: [created, ...state.customRecipes],
        }));
      },

      removeCustomRecipe: (id) => {
        set((state) => ({
          customRecipes: state.customRecipes.filter((r) => r.id !== id),
        }));
      },

      addProgressPhoto: (photo) => {
        const created: ProgressPhotoEntry = {
          ...photo,
          id: `prog-${Date.now()}`,
        };
        set((state) => ({
          progressPhotos: [...state.progressPhotos, created],
        }));
      },

      addWeeklyWeightLog: (newWeightKg) => {
        const { userProfile, weeklyWeightLogs } = get();
        const roundedNew = Math.round(newWeightKg * 10) / 10;
        const prevWeight =
          weeklyWeightLogs.length > 0
            ? weeklyWeightLogs[weeklyWeightLogs.length - 1].weightKg
            : userProfile.weightKg;
        const deltaKg = Math.round((roundedNew - prevWeight) * 10) / 10;

        const dateStr = new Intl.DateTimeFormat('tr-TR', {
          day: 'numeric',
          month: 'short',
        }).format(new Date());

        const heightM = (userProfile.heightCm || 175) / 100;
        const updatedBmi = Math.round((roundedNew / (heightM * heightM)) * 10) / 10;

        const createdLog: WeeklyWeightEntry = {
          id: `ww-${Date.now()}`,
          dateStr,
          weekLabel: `${weeklyWeightLogs.length + 1}. Hafta`,
          weightKg: roundedNew,
          previousWeightKg: prevWeight,
          deltaKg,
          goalAtLog: userProfile.dietaryGoal,
        };

        set((state) => ({
          weeklyWeightLogs: [...state.weeklyWeightLogs, createdLog],
          userProfile: {
            ...state.userProfile,
            weightKg: roundedNew,
            bmi: updatedBmi,
          },
        }));
      },

      markWeeklyLogCalibrated: (logId, newTargetCalories) => {
        set((state) => ({
          weeklyWeightLogs: state.weeklyWeightLogs.map((log) =>
            log.id === logId
              ? { ...log, caloriesAdjustedTo: newTargetCalories }
              : log
          ),
        }));
      },

      getDailySummary: () => {
        const { todayMeals, userProfile, waterIntakeMl } = get();

        const totalCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
        const totalProtein =
          Math.round(todayMeals.reduce((acc, m) => acc + m.proteinGrams, 0) * 10) / 10;
        const totalCarbs =
          Math.round(todayMeals.reduce((acc, m) => acc + m.carbsGrams, 0) * 10) / 10;
        const totalFat =
          Math.round(todayMeals.reduce((acc, m) => acc + m.fatGrams, 0) * 10) / 10;
        const totalFiber =
          Math.round(
            todayMeals.reduce(
              (acc, m) =>
                acc +
                (m.fiberGrams !== undefined ? m.fiberGrams : (m.carbsGrams || 0) * 0.14),
              0
            ) * 10
          ) / 10;
        const totalSugar =
          Math.round(
            todayMeals.reduce(
              (acc, m) =>
                acc +
                (m.sugarGrams !== undefined ? m.sugarGrams : (m.carbsGrams || 0) * 0.11),
              0
            ) * 10
          ) / 10;
        const totalSodium = Math.round(
          todayMeals.reduce(
            (acc, m) => acc + (m.sodiumMg !== undefined ? m.sodiumMg : m.calories * 1.1),
            0
          )
        );

        const remainingCalories = Math.max(0, userProfile.targetCalories - totalCalories);
        const calorieProgressPercent = Math.min(
          100,
          Math.round((totalCalories / (userProfile.targetCalories || 2100)) * 100)
        );
        const waterProgressPercent = Math.min(
          100,
          Math.round((waterIntakeMl / (userProfile.waterGoalMl || 2500)) * 100)
        );

        // Cal AI Inspired 0-100 Daily Health Score
        let score = 0;
        const targetCal = userProfile.targetCalories || 2100;
        const targetProt = userProfile.targetProteinGrams || 135;
        const targetWater = userProfile.waterGoalMl || 2500;

        // 1. Calorie Progression & Discipline (Max 40 pts)
        if (totalCalories > 0) {
          const calRatio = totalCalories / targetCal;
          if (calRatio <= 1.08) {
            score += Math.min(40, Math.round(calRatio * 40));
          } else {
            // Penalty if significantly over target calories
            const overPenalty = Math.min(25, Math.round((calRatio - 1.08) * 50));
            score += Math.max(15, 40 - overPenalty);
          }
        }

        // 2. Protein Goal Achievement (Max 35 pts)
        const proteinRatio = Math.min(1, totalProtein / targetProt);
        score += Math.round(proteinRatio * 35);

        // 3. Hydration Discipline (Max 15 pts)
        const waterRatio = Math.min(1, waterIntakeMl / targetWater);
        score += Math.round(waterRatio * 15);

        // 4. Dietary Fiber & Nutrient Quality Bonus (Max 10 pts)
        const fiberBonus = Math.min(10, Math.round((totalFiber / 25) * 10));
        score += fiberBonus;

        const healthScore = Math.max(0, Math.min(100, score));
        let healthScoreLabel = 'Güne Başlangıç 🌱';
        if (healthScore >= 80) healthScoreLabel = 'Mükemmel Denge 🌟';
        else if (healthScore >= 60) healthScoreLabel = 'İyi İlerleme 🔥';
        else if (healthScore >= 35) healthScoreLabel = 'Dengeli Gidişat ⚡';

        return {
          totalCalories,
          remainingCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          totalFiber,
          totalSugar,
          totalSodium,
          calorieProgressPercent,
          waterProgressPercent,
          healthScore,
          healthScoreLabel,
        };
      },
    }),
    {
      name: 'diet-ai-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.checkAndRollOverDay();
      },
      partialize: (state) => ({
        userProfile: state.userProfile,
        todayMeals: state.todayMeals,
        waterIntakeMl: state.waterIntakeMl,
        streakDays: state.streakDays,
        customRecipes: state.customRecipes,
        progressPhotos: state.progressPhotos,
        useMockData: state.useMockData,
        isDarkMode: state.isDarkMode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        lastActiveDate: state.lastActiveDate,
      }),
    }
  )
);
