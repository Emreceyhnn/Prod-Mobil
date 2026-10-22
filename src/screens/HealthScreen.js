import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import GlassCard from "../components/GlassCard";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing, typography } from "../theme/colors";
import {
  initHealthKit,
  syncAllHealthData,
  fetchCurrentHealthSnapshot,
} from "../services/healthService";
import { useBluetoothDevices } from "../services/bluetoothService";

function MetricTile({ label, value, unit }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value != null ? Math.round(value * 10) / 10 : "—"}
        {value != null && unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export default function HealthScreen() {
  const { user } = useAuth();
  const [healthKitReady, setHealthKitReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState({
    weight: null,
    steps: null,
    activeEnergy: null,
    bodyFat: null,
    heartRate: null,
  });

  const {
    devices,
    scanning,
    connectedDevice,
    error: bleError,
    startScan,
    connectToDevice,
  } = useBluetoothDevices();

  const loadSnapshot = useCallback(async () => {
    if (Platform.OS !== "ios") return;
    try {
      const data = await fetchCurrentHealthSnapshot();
      setSnapshot(data);
    } catch (e) {
      // Sessizce geç — izinler henüz verilmemiş olabilir
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "ios") {
      initHealthKit()
        .then(() => {
          setHealthKitReady(true);
          loadSnapshot();
        })
        .catch((e) => Alert.alert("HealthKit Hatası", e.message));
    }
  }, [loadSnapshot]);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const result = await syncAllHealthData(user.id);
      await loadSnapshot();
      if (result.errors.length > 0) {
        Alert.alert("Kısmen Tamamlandı", result.errors.join("\n"));
      }
    } catch (e) {
      Alert.alert("Senkronizasyon Hatası", e.message);
    } finally {
      setSyncing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSnapshot();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Sağlık</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Günlük Vitaller</Text>
          <Text style={styles.cardBody}>
            Durum: {Platform.OS === "ios" ? (healthKitReady ? "Apple Health Bağlı" : "Bağlanıyor...") : "Yalnızca iOS"}
          </Text>

          <View style={styles.grid}>
            <MetricTile label="Adım" value={snapshot.steps} unit="" />
            <MetricTile label="Yakılan Kalori" value={snapshot.activeEnergy} unit="kcal" />
            <MetricTile label="Kilo" value={snapshot.weight} unit="kg" />
            <MetricTile label="Yağ Oranı" value={snapshot.bodyFat} unit="%" />
            <MetricTile label="Nabız" value={snapshot.heartRate} unit="bpm" />
          </View>

          <PrimaryButton
            title="Şimdi Senkronize Et"
            onPress={handleSync}
            loading={syncing}
            disabled={Platform.OS !== "ios"}
            style={{ marginTop: spacing.md }}
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
  cardBody: { ...typography.bodyMd, color: colors.textSecondary, marginBottom: spacing.sm },
  errorText: { ...typography.bodySm, color: colors.alertCoral, marginTop: spacing.xs },
  deviceItem: {
    ...typography.bodyMd,
    color: colors.secondary,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metricTile: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: "center",
  },
  metricLabel: { ...typography.labelCaps, color: colors.textSecondary, marginBottom: 4 },
  metricValue: { ...typography.headlineSm, color: colors.textPrimary },
  metricUnit: { ...typography.bodySm, color: colors.textSecondary, fontWeight: "400" },
});
