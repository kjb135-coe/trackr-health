import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import {
  habitRepository,
  sleepRepository,
  exerciseRepository,
  nutritionRepository,
  journalRepository,
} from '@/src/database/repositories';
import {
  Habit,
  HabitCompletion,
  SleepEntry,
  ExerciseSession,
  Meal,
  JournalEntry,
} from '@/src/types';

/** Escape a value for CSV per RFC 4180: wrap in quotes, double any internal quotes. */
function csvEscape(value: string | null | undefined): string {
  const str = value ?? '';
  return `"${str.replace(/"/g, '""')}"`;
}

interface ExportData {
  exportedAt: string;
  version: string;
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  sleep: SleepEntry[];
  exercise: ExerciseSession[];
  meals: Meal[];
  journal: JournalEntry[];
}

export async function exportAllData(): Promise<string> {
  const habits = await habitRepository.getAll();
  const habitCompletions = await habitRepository.getAllCompletions();
  const sleep = await sleepRepository.getAll();
  const exercise = await exerciseRepository.getAll();
  const meals = await nutritionRepository.getAllMeals();
  const journal = await journalRepository.getAll();

  const exportData: ExportData = {
    exportedAt: new Date().toISOString(),
    version: Constants.expoConfig?.version ?? '1.0.0',
    habits,
    habitCompletions,
    sleep,
    exercise,
    meals,
    journal,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const fileName = `trackr-export-${new Date().toISOString().split('T')[0]}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonString);

  return filePath;
}

export async function shareExportedData(): Promise<void> {
  const filePath = await exportAllData();

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Trackr Data',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

export async function generateCSVExport(
  type: 'habits' | 'sleep' | 'exercise' | 'nutrition' | 'journal',
): Promise<string> {
  let csvContent = '';
  let fileName = '';

  switch (type) {
    case 'habits': {
      const habits = await habitRepository.getAll();
      csvContent = 'id,name,description,frequency,color,icon,reminderTime,createdAt\n';
      habits.forEach((h) => {
        csvContent += `${csvEscape(h.id)},${csvEscape(h.name)},${csvEscape(h.description)},${csvEscape(h.frequency)},${csvEscape(h.color)},${csvEscape(h.icon)},${csvEscape(h.reminderTime)},${csvEscape(h.createdAt)}\n`;
      });
      fileName = 'trackr-habits.csv';
      break;
    }
    case 'sleep': {
      const sleep = await sleepRepository.getAll();
      csvContent = 'id,date,bedtime,wakeTime,durationMinutes,quality,notes,factors,createdAt\n';
      sleep.forEach((s) => {
        csvContent += `${csvEscape(s.id)},${csvEscape(s.date)},${csvEscape(s.bedtime)},${csvEscape(s.wakeTime)},${s.durationMinutes},${s.quality},${csvEscape(s.notes)},${csvEscape((s.factors || []).join(';'))},${csvEscape(s.createdAt)}\n`;
      });
      fileName = 'trackr-sleep.csv';
      break;
    }
    case 'exercise': {
      const exercise = await exerciseRepository.getAll();
      csvContent = 'id,date,type,durationMinutes,intensity,caloriesBurned,notes,createdAt\n';
      exercise.forEach((e) => {
        csvContent += `${csvEscape(e.id)},${csvEscape(e.date)},${csvEscape(e.type)},${e.durationMinutes},${csvEscape(e.intensity)},${e.caloriesBurned || 0},${csvEscape(e.notes)},${csvEscape(e.createdAt)}\n`;
      });
      fileName = 'trackr-exercise.csv';
      break;
    }
    case 'nutrition': {
      const meals = await nutritionRepository.getAllMeals();
      csvContent =
        'id,date,mealType,name,totalCalories,totalProtein,totalCarbs,totalFat,createdAt\n';
      meals.forEach((m) => {
        csvContent += `${csvEscape(m.id)},${csvEscape(m.date)},${csvEscape(m.mealType)},${csvEscape(m.name)},${m.totalCalories},${m.totalProtein || 0},${m.totalCarbs || 0},${m.totalFat || 0},${csvEscape(m.createdAt)}\n`;
      });
      fileName = 'trackr-nutrition.csv';
      break;
    }
    case 'journal': {
      const journal = await journalRepository.getAll();
      csvContent = 'id,date,title,mood,tags,isScanned,createdAt\n';
      journal.forEach((j) => {
        csvContent += `${csvEscape(j.id)},${csvEscape(j.date)},${csvEscape(j.title)},${j.mood || ''},${csvEscape((j.tags || []).join(';'))},${j.isScanned},${csvEscape(j.createdAt)}\n`;
      });
      fileName = 'trackr-journal.csv';
      break;
    }
  }

  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csvContent);

  return filePath;
}

export async function shareCSVExport(
  type: 'habits' | 'sleep' | 'exercise' | 'nutrition' | 'journal',
): Promise<void> {
  const filePath = await generateCSVExport(type);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: `Export ${type} data`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}
