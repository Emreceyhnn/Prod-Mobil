import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REMINDER_STATE_KEY = "@vela/reminder_toggles";

export async function requestNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Her gün belirli bir saatte tekrar eden yerel bir hatırlatma planlar.
 * identifier aynı kalırsa (örn. "daily-water-reminder") önceki
 * zamanlamanın üstüne yazılır, tekrar tekrar birikmez.
 */
export async function scheduleDailyReminder({ identifier, title, body, hour, minute = 0 }) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, sound: Platform.OS === "ios" ? "default" : undefined },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelReminder(identifier) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

export async function getScheduledReminders() {
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function getReminderToggles() {
  const raw = await AsyncStorage.getItem(REMINDER_STATE_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function setReminderToggle(identifier, enabled) {
  const toggles = await getReminderToggles();
  const next = { ...toggles, [identifier]: enabled };
  await AsyncStorage.setItem(REMINDER_STATE_KEY, JSON.stringify(next));
  return next;
}

export const REMINDER_PRESETS = {
  WATER: {
    identifier: "daily-water-reminder",
    title: "💧 Su İçme Zamanı",
    body: "Bugün yeterince su içtin mi? Birkaç bardak daha ekle.",
  },
  WEIGHT_CHECK: {
    identifier: "daily-weight-reminder",
    title: "⚖️ Günlük Tartım",
    body: "Sabah tartımını yapmayı unutma — trendini takip etmeye devam et.",
  },
  EXPENSE_REVIEW: {
    identifier: "daily-expense-review",
    title: "💳 Harcama Özeti",
    body: "Bugünkü harcamalarını gözden geçir, bütçeni kontrol et.",
  },
};
