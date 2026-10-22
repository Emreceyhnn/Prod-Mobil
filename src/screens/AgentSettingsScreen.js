import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, typography } from "../theme/colors";
import { saveAgentConfig, getAgentConfig } from "../services/agentService";

export default function AgentSettingsScreen({ navigation }) {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAgentConfig().then((config) => {
      if (config) {
        setEndpoint(config.endpoint || "");
        setApiKey(config.apiKey || "");
        setModel(config.model || "");
      }
    });
  }, []);

  const handleSave = async () => {
    if (!endpoint) {
      Alert.alert("Eksik Bilgi", "Agent endpoint adresi girilmelidir.");
      return;
    }
    setSaving(true);
    try {
      await saveAgentConfig({ endpoint: endpoint.trim(), apiKey: apiKey.trim(), model: model.trim() });
      Alert.alert("Kaydedildi", "Agent ayarlarınız kaydedildi.");
      navigation?.goBack?.();
    } catch (e) {
      Alert.alert("Hata", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Agent Ayarları</Text>
        <Text style={styles.subtitle}>
          Kendi AI Agent endpoint ve API anahtarınızı tanımlayın. Uyumlu format:
          OpenAI-style chat completions (messages dizisi).
        </Text>

        <TextField
          placeholder="https://your-agent-endpoint.com/v1/chat"
          autoCapitalize="none"
          value={endpoint}
          onChangeText={setEndpoint}
        />
        <TextField
          placeholder="API Anahtarı (Bearer token)"
          autoCapitalize="none"
          secureTextEntry
          value={apiKey}
          onChangeText={setApiKey}
        />
        <TextField
          placeholder="Model adı (opsiyonel)"
          autoCapitalize="none"
          value={model}
          onChangeText={setModel}
        />

        <PrimaryButton title="Kaydet" onPress={handleSave} loading={saving} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md, gap: spacing.sm },
  title: { ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySm, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 18 },
});
