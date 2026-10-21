import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, LoggedMealItem } from '../types';
import { DEFAULT_USER_PROFILE, INITIAL_TODAY_MEALS } from '../constants/mockData';

export interface DailySummary {
  totalCalories: number;
  remainingCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieProgressPercent: number;
  waterProgressPercent: number;
}

interface DietStoreState {
  userProfile: UserProfile;
  todayMeals: LoggedMealItem[];
  waterIntakeMl: number;
  useMockData: boolean;
  isDarkMode: boolean;
  hasHydrated: boolean;
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
  checkAndRollOverDay: () => void;

  // Computed helper
  getDailySummary: () => DailySummary;
}

export const useDietStore = create<DietStoreState>()(
  persist(
    (set, get) => ({
      userProfile: DEFAULT_USER_PROFILE,
      todayMeals: INITIAL_TODAY_MEALS,
      waterIntakeMl: 1250,
      useMockData: true,
      isDarkMode: false,
      hasHydrated: false,
      lastActiveDate: new Intl.DateTimeFormat('en-CA').format(new Date()),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (enabled) => set({ isDarkMode: enabled }),
      setHasHydrated: (state) => set({ hasHydrated: state }),

      checkAndRollOverDay: () => {
        const todayDate = new Intl.DateTimeFormat('en-CA').format(new Date());
        const { lastActiveDate } = get();

        // If app rolls over to a new calendar date, clear today's meal and water trackers
        if (lastActiveDate && lastActiveDate !== todayDate) {
          set({
            todayMeals: [],
            waterIntakeMl: 0,
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

        const createdItem: LoggedMealItem = {
          ...newMeal,
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

      getDailySummary: () => {
        const { todayMeals, userProfile, waterIntakeMl } = get();

        const totalCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
        const totalProtein = Math.round(todayMeals.reduce((acc, m) => acc + m.proteinGrams, 0) * 10) / 10;
        const totalCarbs = Math.round(todayMeals.reduce((acc, m) => acc + m.carbsGrams, 0) * 10) / 10;
        const totalFat = Math.round(todayMeals.reduce((acc, m) => acc + m.fatGrams, 0) * 10) / 10;

        const remainingCalories = Math.max(0, userProfile.targetCalories - totalCalories);
        const calorieProgressPercent = Math.min(
          100,
          Math.round((totalCalories / userProfile.targetCalories) * 100)
        );
        const waterProgressPercent = Math.min(
          100,
          Math.round((waterIntakeMl / userProfile.waterGoalMl) * 100)
        );

        return {
          totalCalories,
          remainingCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          calorieProgressPercent,
          waterProgressPercent,
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
        useMockData: state.useMockData,
        isDarkMode: state.isDarkMode,
        lastActiveDate: state.lastActiveDate,
      }),
    }
  )
);
