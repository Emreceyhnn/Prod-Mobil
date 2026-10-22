import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase";
import { safeFetch } from "./networkUtils";

const AGENT_CONFIG_KEY = "@vela/agent_config";
const AGENT_API_KEY_SECURE_KEY = "vela_agent_api_key";

/**
 * Kullanıcının kendi AI Agent endpoint + API key bilgisini cihazda saklar.
 * API key, iOS Keychain / Android Keystore üzerinden şifreli tutulur
 * (expo-secure-store); endpoint ve model gibi hassas olmayan alanlar
 * AsyncStorage'da düz metin kalır.
 */
export async function saveAgentConfig({ endpoint, apiKey, model }) {
  const config = { endpoint, model: model || "default" };
  await AsyncStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
  if (apiKey) {
    await SecureStore.setItemAsync(AGENT_API_KEY_SECURE_KEY, apiKey);
  } else {
    await SecureStore.deleteItemAsync(AGENT_API_KEY_SECURE_KEY).catch(() => {});
  }
  return { ...config, apiKey };
}

export async function getAgentConfig() {
  const raw = await AsyncStorage.getItem(AGENT_CONFIG_KEY);
  if (!raw) return null;
  const config = JSON.parse(raw);
  const apiKey = await SecureStore.getItemAsync(AGENT_API_KEY_SECURE_KEY);
  return { ...config, apiKey: apiKey || "" };
}

export async function clearAgentConfig() {
  await AsyncStorage.removeItem(AGENT_CONFIG_KEY);
  await SecureStore.deleteItemAsync(AGENT_API_KEY_SECURE_KEY).catch(() => {});
}

/**
 * Kullanıcının tanımladığı özel endpoint'e isteği gönderir ve yanıtı Supabase'e loglar.
 */
export async function sendMessageToAgent(userId, prompt) {
  const config = await getAgentConfig();
  if (!config?.endpoint) {
    throw new Error("Önce Agent ayarlarından bir endpoint ve API anahtarı tanımlamalısınız.");
  }

  const response = await safeFetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Agent isteği başarısız (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const replyText =
    data?.choices?.[0]?.message?.content ??
    data?.reply ??
    data?.message ??
    JSON.stringify(data);

  const { error } = await supabase.from("ai_agent_logs").insert({
    user_id: userId,
    prompt,
    response: replyText,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;

  return replyText;
}

const RECEIPT_EXTRACTION_PROMPT = `Bu bir fiş, fatura veya banka işlem ekran görüntüsüdür.
Aşağıdaki alanları SADECE geçerli bir JSON nesnesi olarak döndür, başka hiçbir metin ekleme:
{
  "amount": <sayı, TL cinsinden toplam tutar, negatif/pozitif işaretsiz>,
  "type": "expense" veya "income",
  "merchant": "<işyeri veya gönderen/alıcı adı>",
  "category": "<Market & Restoran, Ulaşım & Yakıt, Konut & Faturalar, Yazılım & Abonelikler, Kişisel & Eğlence, Sağlık, Gelir, Diğer kategorilerinden biri>"
}
Emin olamadığın alanlar için en iyi tahminini yap. Yanıtında JSON dışında hiçbir şey olmasın.`;

/**
 * Bir fiş/ekran görüntüsünü (base64 data URI) agent'a gönderir ve
 * yapılandırılmış bir harcama/gelir nesnesi döndürür.
 * Agent endpoint'inin OpenAI-uyumlu vision (image_url content) formatını
 * desteklemesi gerekir.
 */
export async function extractExpenseFromImage(userId, base64ImageDataUri) {
  const config = await getAgentConfig();
  if (!config?.endpoint) {
    throw new Error("Önce Agent ayarlarından bir endpoint ve API anahtarı tanımlamalısınız.");
  }

  const response = await safeFetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: RECEIPT_EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: base64ImageDataUri } },
          ],
        },
      ],
    }),
  }, 30000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Agent isteği başarısız (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const replyText =
    data?.choices?.[0]?.message?.content ?? data?.reply ?? data?.message ?? "";

  await supabase.from("ai_agent_logs").insert({
    user_id: userId,
    prompt: "[Fiş/ekran görüntüsü taraması]",
    response: replyText,
    created_at: new Date().toISOString(),
  });

  const jsonMatch = replyText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Agent yanıtından geçerli bir JSON çıkarılamadı: " + replyText);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.amount || Number.isNaN(Number(parsed.amount))) {
    throw new Error("Agent yanıtında geçerli bir tutar bulunamadı.");
  }

  const amount = Math.abs(Number(parsed.amount));
  const type = parsed.type === "income" ? "income" : "expense";

  return {
    amount: type === "income" ? amount : -amount,
    type,
    merchant: parsed.merchant || "Bilinmeyen İşyeri",
    category: parsed.category || (type === "income" ? "Gelir" : "Diğer"),
    source: "ai_photo_scan",
    raw_text: replyText,
  };
}

export async function fetchAgentHistory(userId, limit = 50) {
  const { data, error } = await supabase
    .from("ai_agent_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
