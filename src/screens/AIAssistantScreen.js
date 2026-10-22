import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import TextField from "../components/TextField";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, typography, radius } from "../theme/colors";
import { sendMessageToAgent, fetchAgentHistory } from "../services/agentService";

export default function AIAssistantScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchAgentHistory(user.id, 30)
      .then((logs) => {
        const formatted = (logs || [])
          .slice()
          .reverse()
          .flatMap((log) => [
            { id: `${log.id}-user`, role: "user", text: log.prompt },
            { id: `${log.id}-agent`, role: "agent", text: log.response },
          ]);
        setMessages(formatted);
      })
      .catch(() => {});
  }, [user]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || !user) return;

    setInput("");
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", text: prompt }]);
    setSending(true);

    try {
      const reply = await sendMessageToAgent(user.id, prompt);
      setMessages((prev) => [
        ...prev,
        { id: `local-reply-${Date.now()}`, role: "agent", text: reply },
      ]);
    } catch (e) {
      Alert.alert("Agent Hatası", e.message);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.role === "user" ? styles.userBubble : styles.agentBubble,
      ]}
    >
      <Text style={styles.bubbleText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={styles.title}>AI Asistan</Text>
          <Text
            style={styles.settingsLink}
            onPress={() => navigation.navigate("AgentSettings")}
          >
            Ayarlar
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputRow}>
          <TextField
            placeholder="Asistanına sor veya komut ver..."
            value={input}
            onChangeText={setInput}
            style={styles.input}
          />
          <PrimaryButton
            title={sending ? "..." : "Gönder"}
            onPress={handleSend}
            loading={sending}
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  title: { ...typography.headlineMd, color: colors.textPrimary },
  settingsLink: { ...typography.labelMd, color: colors.primary },
  list: { padding: spacing.md, gap: spacing.sm },
  bubble: {
    maxWidth: "85%",
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  userBubble: {
    backgroundColor: "rgba(128, 131, 255, 0.25)",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: colors.surfaceCard,
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
  },
  bubbleText: { ...typography.bodyMd, color: colors.textPrimary, lineHeight: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: { flex: 1, marginBottom: 0 },
  sendButton: { paddingHorizontal: spacing.md },
});
