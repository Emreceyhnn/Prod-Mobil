import { Platform, NativeEventEmitter, NativeModules } from "react-native";
import RNAndroidNotificationListener from "react-native-android-notification-listener";
import { supabase } from "./supabase";

const AMOUNT_REGEX = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s?(?:TL|₺)/i;
const MERCHANT_REGEX = /(?:işyeri|merchant)[:\s]+([A-Za-zÇĞİÖŞÜçğıöşü0-9\s&.]+)/i;

// Gelir bildirimlerinde sık görülen ifadeler (banka/PayTR/Papara vb. TR formatı)
const INCOME_KEYWORDS = [
  "hesabınıza",
  "yatırıldı",
  "geldi",
  "gelen havale",
  "gelen eft",
  "alacak",
  "tahsilat",
  "iade",
  "maaş",
  "ödeme alındı",
];

// Harcama bildirimlerinde sık görülen ifadeler
const EXPENSE_KEYWORDS = [
  "harcama",
  "işlem",
  "ödeme",
  "tutar",
  "bakiye",
  "çekildi",
  "gönderildi",
  "fatura",
];

// Basit anahtar kelime -> kategori eşlemesi (işyeri/metin içinde arama)
const CATEGORY_RULES = [
  { category: "Market & Restoran", keywords: ["market", "migros", "carrefour", "a101", "bim", "şok", "restoran", "yemek", "cafe", "kahve", "starbucks"] },
  { category: "Ulaşım & Yakıt", keywords: ["shell", "opet", "petrol", "bp", "otopark", "ehliyet", "hgs", "ogs", "taksi", "uber", "bitaksi"] },
  { category: "Yazılım & Abonelikler", keywords: ["spotify", "netflix", "apple", "google", "aws", "openai", "anthropic", "abonelik", "subscription"] },
  { category: "Konut & Faturalar", keywords: ["elektrik", "su faturası", "doğalgaz", "internet", "kira", "aidat", "telekom", "turkcell", "vodafone"] },
  { category: "Kişisel & Eğlence", keywords: ["sinema", "bilet", "konser", "oyun", "steam", "playstation"] },
  { category: "Sağlık", keywords: ["eczane", "hastane", "doktor", "sağlık"] },
];

function detectType(text) {
  const lower = text.toLowerCase();
  const isIncome = INCOME_KEYWORDS.some((kw) => lower.includes(kw));
  if (isIncome) return "income";

  const isExpense = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw));
  if (isExpense) return "expense";

  return null;
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }
  return "Diğer";
}

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

/**
 * Bildirim metnini income/expense olarak sınıflandırır, tutarı ve
 * kategoriyi tahmin eder. Eşleşme yoksa null döner.
 */
export function parseExpenseFromNotification(rawText) {
  if (!rawText) return null;

  const type = detectType(rawText);
  if (!type) return null;

  const amountMatch = rawText.match(AMOUNT_REGEX);
  if (!amountMatch) return null;

  const amount = parseFloat(
    amountMatch[1].replace(/\./g, "").replace(",", ".")
  );
  if (!amount || Number.isNaN(amount)) return null;

  const merchantMatch = rawText.match(MERCHANT_REGEX);
  const merchant = merchantMatch ? merchantMatch[1].trim() : "Bilinmeyen İşyeri";
  const category = type === "income" ? "Gelir" : detectCategory(rawText);

  return {
    amount: type === "income" ? Math.abs(amount) : -Math.abs(amount),
    type,
    merchant,
    category,
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
