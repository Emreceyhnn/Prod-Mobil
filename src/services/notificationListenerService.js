import { Platform, NativeEventEmitter, NativeModules } from "react-native";
import RNAndroidNotificationListener from "react-native-android-notification-listener";
import { supabase } from "./supabase";

// Banka/harcama bildirimlerinde sık görülen anahtar kelimeler (TR bankacılık SMS/push formatı)
const EXPENSE_KEYWORDS = ["TL", "₺", "harcama", "işlem", "ödeme", "tutar", "bakiye"];
const AMOUNT_REGEX = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s?(?:TL|₺)/i;
const MERCHANT_REGEX = /(?:işyeri|merchant)[:\s]+([A-Za-zÇĞİÖŞÜçğıöşü0-9\s&.]+)/i;

/**
 * Android bildirim dinleyici servisini başlatır.
 * Kullanıcının izin ekranından "Bildirim Erişimi"ni açması gerekir.
 */
export async function requestNotificationListenerPermission() {
  if (Platform.OS !== "android") return false;
  const status = await RNAndroidNotificationListener.getPermissionStatus();
  if (status !== "authorized") {
    RNAndroidNotificationListener.requestPermission();
    return false;
  }
  return true;
}

export function parseExpenseFromNotification(rawText) {
  if (!rawText) return null;

  const hasExpenseKeyword = EXPENSE_KEYWORDS.some((kw) =>
    rawText.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasExpenseKeyword) return null;

  const amountMatch = rawText.match(AMOUNT_REGEX);
  if (!amountMatch) return null;

  const amount = parseFloat(
    amountMatch[1].replace(/\./g, "").replace(",", ".")
  );

  const merchantMatch = rawText.match(MERCHANT_REGEX);
  const merchant = merchantMatch ? merchantMatch[1].trim() : "Bilinmeyen İşyeri";

  return {
    amount,
    merchant,
    category: "Diğer",
    source: "notification",
    raw_text: rawText,
  };
}

export async function saveExpenseFromNotification(userId, parsedExpense) {
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    amount: parsedExpense.amount,
    category: parsedExpense.category,
    merchant: parsedExpense.merchant,
    source: parsedExpense.source,
    raw_text: parsedExpense.raw_text,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/**
 * Bildirim event emitter'ını dinleyip gelen her bildirimi işler.
 * App.js içinde useEffect ile çağrılır, dönen unsubscribe fonksiyonu ile kapatılır.
 */
export function subscribeToNotifications(userId, onExpenseCaptured) {
  if (Platform.OS !== "android") {
    return () => {};
  }

  const emitter = new NativeEventEmitter(NativeModules.RNAndroidNotificationListener);

  const subscription = emitter.addListener(
    "RNAndroidNotificationListener-ReceiveNotification",
    async (notification) => {
      try {
        const payload =
          typeof notification === "string" ? JSON.parse(notification) : notification;
        const text = `${payload?.title ?? ""} ${payload?.text ?? ""}`;

        const parsed = parseExpenseFromNotification(text);
        if (parsed && userId) {
          await saveExpenseFromNotification(userId, parsed);
          onExpenseCaptured?.(parsed);
        }
      } catch (e) {
        console.warn("Bildirim işleme hatası:", e.message);
      }
    }
  );

  return () => subscription.remove();
}
