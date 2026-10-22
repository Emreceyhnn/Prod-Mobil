import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const AGENT_CONFIG_KEY = "@hepsio/agent_config";

/**
 * Kullanıcının kendi AI Agent endpoint + API key bilgisini cihazda saklar.
 * Not: Üretimde hassas anahtarlar için expo-secure-store tercih edilmelidir.
 */
export async function saveAgentConfig({ endpoint, apiKey, model }) {
  const config = { endpoint, apiKey, model: model || "default" };
  await AsyncStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
  return config;
}

export async function getAgentConfig() {
  const raw = await AsyncStorage.getItem(AGENT_CONFIG_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAgentConfig() {
  await AsyncStorage.removeItem(AGENT_CONFIG_KEY);
}

/**
 * Kullanıcının tanımladığı özel endpoint'e isteği gönderir ve yanıtı Supabase'e loglar.
 */
export async function sendMessageToAgent(userId, prompt) {
  const config = await getAgentConfig();
  if (!config?.endpoint) {
    throw new Error("Önce Agent ayarlarından bir endpoint ve API anahtarı tanımlamalısınız.");
  }

  const response = await fetch(config.endpoint, {
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
