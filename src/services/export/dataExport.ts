import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { habitRepository, sleepRepository, exerciseRepository, nutritionRepository, journalRepository } from '@/src/database/repositories';

interface ExportData {
  exportedAt: string;
  version: string;
  habits: any[];
  habitCompletions: any[];
  sleep: any[];
  exercise: any[];
  meals: any[];
  journal: any[];
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
    version: '1.6.0',
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

export async function generateCSVExport(type: 'habits' | 'sleep' | 'exercise' | 'nutrition' | 'journal'): Promise<string> {
  let csvContent = '';
  let fileName = '';

  switch (type) {
    case 'habits': {
      const habits = await habitRepository.getAll();
      csvContent = 'id,name,description,frequency,color,icon,reminderTime,createdAt\n';
      habits.forEach((h) => {
        csvContent += `"${h.id}","${h.name}","${h.description || ''}","${h.frequency}","${h.color}","${h.icon}","${h.reminderTime || ''}","${h.createdAt}"\n`;
      });
      fileName = 'trackr-habits.csv';
      break;
    }
    case 'sleep': {
      const sleep = await sleepRepository.getAll();
      csvContent = 'id,date,bedtime,wakeTime,durationMinutes,quality,notes,factors,createdAt\n';
      sleep.forEach((s) => {
        csvContent += `"${s.id}","${s.date}","${s.bedtime}","${s.wakeTime}",${s.durationMinutes},${s.quality},"${s.notes || ''}","${(s.factors || []).join(';')}","${s.createdAt}"\n`;
      });
      fileName = 'trackr-sleep.csv';
      break;
    }
    case 'exercise': {
      const exercise = await exerciseRepository.getAll();
      csvContent = 'id,date,type,durationMinutes,intensity,caloriesBurned,notes,createdAt\n';
      exercise.forEach((e) => {
        csvContent += `"${e.id}","${e.date}","${e.type}",${e.durationMinutes},"${e.intensity}",${e.caloriesBurned || 0},"${e.notes || ''}","${e.createdAt}"\n`;
      });
      fileName = 'trackr-exercise.csv';
      break;
    }
    case 'nutrition': {
      const meals = await nutritionRepository.getAllMeals();
      csvContent = 'id,date,mealType,name,totalCalories,totalProtein,totalCarbs,totalFat,createdAt\n';
      meals.forEach((m) => {
        csvContent += `"${m.id}","${m.date}","${m.mealType}","${m.name || ''}",${m.totalCalories},${m.totalProtein || 0},${m.totalCarbs || 0},${m.totalFat || 0},"${m.createdAt}"\n`;
      });
      fileName = 'trackr-nutrition.csv';
      break;
    }
    case 'journal': {
      const journal = await journalRepository.getAll();
      csvContent = 'id,date,title,mood,tags,isScanned,createdAt\n';
      journal.forEach((j) => {
        csvContent += `"${j.id}","${j.date}","${j.title}",${j.mood || ''},"${(j.tags || []).join(';')}",${j.isScanned},"${j.createdAt}"\n`;
      });
      fileName = 'trackr-journal.csv';
      break;
    }
  }

  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, csvContent);

  return filePath;
}

export async function shareCSVExport(type: 'habits' | 'sleep' | 'exercise' | 'nutrition' | 'journal'): Promise<void> {
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
