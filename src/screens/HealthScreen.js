import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, typography } from "../theme/colors";
import { initHealthKit, syncAllHealthData } from "../services/healthService";
import { useBluetoothDevices } from "../services/bluetoothService";

export default function HealthScreen() {
  const { user } = useAuth();
  const [healthKitReady, setHealthKitReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const {
    devices,
    scanning,
    connectedDevice,
    error: bleError,
    startScan,
    connectToDevice,
  } = useBluetoothDevices();

  useEffect(() => {
    if (Platform.OS === "ios") {
      initHealthKit()
        .then(() => setHealthKitReady(true))
        .catch((e) => Alert.alert("HealthKit Hatası", e.message));
    }
  }, []);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const result = await syncAllHealthData(user.id);
      setLastSync(result);
      Alert.alert("Senkronizasyon Tamamlandı", JSON.stringify(result, null, 2));
    } catch (e) {
      Alert.alert("Senkronizasyon Hatası", e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sağlık</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Apple Health</Text>
          <Text style={styles.cardBody}>
            Durum: {Platform.OS === "ios" ? (healthKitReady ? "Bağlı" : "Bağlanıyor...") : "Yalnızca iOS"}
          </Text>
          <PrimaryButton
            title="Şimdi Senkronize Et"
            onPress={handleSync}
            loading={syncing}
            disabled={Platform.OS !== "ios"}
            style={{ marginTop: spacing.sm }}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Bluetooth Cihazları</Text>
          <Text style={styles.cardBody}>
            {connectedDevice ? `Bağlı: ${connectedDevice.name}` : "Bağlı cihaz yok"}
          </Text>
          <PrimaryButton
            title={scanning ? "Taranıyor..." : "Cihazları Tara"}
            onPress={startScan}
            loading={scanning}
            style={{ marginTop: spacing.sm }}
          />
          {bleError && <Text style={styles.errorText}>{bleError}</Text>}
          {devices.map((d) => (
            <Text
              key={d.id}
              style={styles.deviceItem}
              onPress={() => connectToDevice(d.id)}
            >
              {d.name} — bağlanmak için dokunun
            </Text>
          ))}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceBase },
  container: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.md },
  title: { ...typography.headlineMd, color: colors.textPrimary, marginBottom: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardTitle: { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.xs },
  cardBody: { ...typography.bodyMd, color: colors.textSecondary },
  errorText: { ...typography.bodySm, color: colors.alertCoral, marginTop: spacing.xs },
  deviceItem: {
    ...typography.bodyMd,
    color: colors.secondary,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
