import React, { useCallback, useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from "react-native";
import TextField from "./TextField";
import PrimaryButton from "./PrimaryButton";
import { colors, spacing, typography, radius } from "../theme/colors";
import { getQuickButtons, addQuickButton, removeQuickButton } from "../services/quickExpenseService";

const EMOJI_OPTIONS = ["☕", "🍔", "🛒", "🚌", "⛽", "💊", "🎮", "💳", "🏠", "📱"];

export default function QuickButtonEditorModal({ visible, onClose, onChanged }) {
  const [buttons, setButtons] = useState([]);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [category, setCategory] = useState("Diğer");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await getQuickButtons();
    setButtons(data);
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleAdd = async () => {
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!label.trim() || !parsedAmount || Number.isNaN(parsedAmount)) {
      Alert.alert("Eksik Bilgi", "Lütfen isim ve geçerli bir tutar girin.");
      return;
    }
    setSaving(true);
    try {
      const next = await addQuickButton({
        label: label.trim(),
        amount: Math.abs(parsedAmount),
        emoji,
        category,
      });
      setButtons(next);
      setLabel("");
      setAmount("");
      onChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    const next = await removeQuickButton(id);
    setButtons(next);
    onChanged?.();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Hızlı Butonlar</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Kapat</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={buttons}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 180 }}
            renderItem={({ item }) => (
              <View style={styles.existingRow}>
                <Text style={styles.existingText}>
                  {item.emoji} {item.label} — ₺{item.amount}
                </Text>
                <TouchableOpacity onPress={() => handleRemove(item.id)}>
                  <Text style={styles.removeText}>Sil</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Henüz hızlı buton yok.</Text>}
          />

          <View style={styles.emojiRow}>
            {EMOJI_OPTIONS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiOption, emoji === e && styles.emojiOptionActive]}
                onPress={() => setEmoji(e)}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextField placeholder="İsim (örn. Kahve)" value={label} onChangeText={setLabel} />
          <TextField
            placeholder="Tutar (₺)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <PrimaryButton title="Buton Ekle" onPress={handleAdd} loading={saving} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceContainer,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.headlineMd, color: colors.textPrimary },
  closeText: { ...typography.labelMd, color: colors.textSecondary },
  existingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  existingText: { ...typography.bodyMd, color: colors.onSurface },
  removeText: { ...typography.bodySm, color: colors.alertCoral },
  empty: { ...typography.bodySm, color: colors.textSecondary, paddingVertical: spacing.sm },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginVertical: spacing.sm },
  emojiOption: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOptionActive: { backgroundColor: colors.primaryContainer },
  emojiText: { fontSize: 18 },
});
