import { Platform } from "react-native";
import AppleHealthKit from "react-native-health";
import { supabase } from "./supabase";

const PERMS = AppleHealthKit.Constants.Permissions;

const HEALTH_PERMISSIONS = {
  permissions: {
    read: [
      PERMS.StepCount,
      PERMS.DistanceWalkingRunning,
      PERMS.HeartRate,
      PERMS.Weight,
      PERMS.Height,
      PERMS.BodyFatPercentage,
      PERMS.BodyMassIndex,
      PERMS.LeanBodyMass,
      PERMS.SleepAnalysis,
      PERMS.ActiveEnergyBurned,
    ],
    write: [PERMS.Weight],
  },
};

export function initHealthKit() {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== "ios") {
      resolve(false);
      return;
    }
    AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, (error) => {
      if (error) {
        reject(new Error("HealthKit izinleri alınamadı: " + error));
        return;
      }
      resolve(true);
    });
  });
}

export function getLatestWeight() {
  return new Promise((resolve, reject) => {
    const options = { unit: "kg" };
    AppleHealthKit.getLatestWeight(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export function getTodayStepCount() {
  return new Promise((resolve, reject) => {
    const options = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };
    AppleHealthKit.getStepCount(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export function getHeartRateSamples(startDate) {
  return new Promise((resolve, reject) => {
    const options = {
      unit: "bpm",
      startDate: startDate || new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date().toISOString(),
      ascending: false,
      limit: 20,
    };
    AppleHealthKit.getHeartRateSamples(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}

export function getTodayActiveEnergyBurned() {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      endDate: new Date().toISOString(),
    };
    AppleHealthKit.getActiveEnergyBurned(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      const total = (results || []).reduce((sum, r) => sum + (r.value || 0), 0);
      resolve(total);
    });
  });
}

export function getLatestBodyFatPercentage() {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getLatestBodyFatPercentage(null, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export function getLatestHeight() {
  return new Promise((resolve, reject) => {
    const options = { unit: "cm" };
    AppleHealthKit.getLatestHeight(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export function getLatestBmi() {
  return new Promise((resolve, reject) => {
    AppleHealthKit.getLatestBmi(null, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export function getLatestLeanBodyMass() {
  return new Promise((resolve, reject) => {
    const options = { unit: "kg" };
    AppleHealthKit.getLatestLeanBodyMass(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export function getTodayWalkingRunningDistance() {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      endDate: new Date().toISOString(),
      unit: "km",
    };
    AppleHealthKit.getDistanceWalkingRunning(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result?.value ?? 0);
    });
  });
}

export function getSleepSamples(startDate) {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: startDate || new Date(Date.now() - 86400000).toISOString(),
      endDate: new Date().toISOString(),
    };
    AppleHealthKit.getSleepSamples(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}

export async function syncHealthMetricToSupabase(userId, metricType, value, unit) {
  const { error } = await supabase.from("health_metrics").insert({
    user_id: userId,
    metric_type: metricType,
    value,
    unit,
    recorded_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function syncAllHealthData(userId) {
  const results = {
    weight: null,
    steps: null,
    activeEnergy: null,
    bodyFat: null,
    bmi: null,
    height: null,
    leanBodyMass: null,
    distance: null,
    errors: [],
  };

  const jobs = [
    ["weight", () => getLatestWeight().then((r) => r?.value), "kg"],
    ["steps", () => getTodayStepCount().then((r) => r?.value), "count"],
    ["active_energy", () => getTodayActiveEnergyBurned(), "kcal"],
    ["body_fat", () => getLatestBodyFatPercentage().then((r) => (r?.value != null ? r.value * 100 : null)), "%"],
    ["bmi", () => getLatestBmi().then((r) => r?.value), "index"],
    ["height", () => getLatestHeight().then((r) => r?.value), "cm"],
    ["lean_body_mass", () => getLatestLeanBodyMass().then((r) => r?.value), "kg"],
    ["distance", () => getTodayWalkingRunningDistance(), "km"],
  ];

  const resultKeyMap = {
    weight: "weight",
    steps: "steps",
    active_energy: "activeEnergy",
    body_fat: "bodyFat",
    bmi: "bmi",
    height: "height",
    lean_body_mass: "leanBodyMass",
    distance: "distance",
  };

  for (const [metricType, fetcher, unit] of jobs) {
    try {
      const value = await fetcher();
      if (value != null) {
        await syncHealthMetricToSupabase(userId, metricType, value, unit);
        results[resultKeyMap[metricType]] = value;
      }
    } catch (e) {
      results.errors.push(`${metricType}: ${e.message}`);
    }
  }

  return results;
}

/**
 * Health ekranında gösterilecek güncel metrikleri HealthKit'ten
 * doğrudan okur (Supabase'e yazmadan, yalnızca UI için).
 */
export async function fetchCurrentHealthSnapshot() {
  const snapshot = {
    weight: null,
    steps: null,
    activeEnergy: null,
    bodyFat: null,
    bmi: null,
    height: null,
    leanBodyMass: null,
    distance: null,
    heartRate: null,
  };

  await Promise.allSettled([
    getLatestWeight().then((r) => {
      snapshot.weight = r?.value ?? null;
    }),
    getTodayStepCount().then((r) => {
      snapshot.steps = r?.value ?? null;
    }),
    getTodayActiveEnergyBurned().then((v) => {
      snapshot.activeEnergy = v;
    }),
    getLatestBodyFatPercentage().then((r) => {
      snapshot.bodyFat = r?.value != null ? r.value * 100 : null;
    }),
    getLatestBmi().then((r) => {
      snapshot.bmi = r?.value ?? null;
    }),
    getLatestHeight().then((r) => {
      snapshot.height = r?.value ?? null;
    }),
    getLatestLeanBodyMass().then((r) => {
      snapshot.leanBodyMass = r?.value ?? null;
    }),
    getTodayWalkingRunningDistance().then((v) => {
      snapshot.distance = v;
    }),
    getHeartRateSamples().then((samples) => {
      snapshot.heartRate = samples?.[0]?.value ?? null;
    }),
  ]);

  return snapshot;
}

/**
 * Supabase health_metrics tablosundan, verilen metrik tipi için son N günün
 * en güncel değerlerini (grafik çizimi için) getirir. Günlük bazda en son
 * kaydı tutar.
 */
export async function fetchHealthMetricHistory(userId, metricType, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("health_metrics")
    .select("value, recorded_at")
    .eq("user_id", userId)
    .eq("metric_type", metricType)
    .gte("recorded_at", since.toISOString())
    .order("recorded_at", { ascending: true });

  if (error) throw error;

  const byDay = new Map();
  for (const row of data || []) {
    const day = row.recorded_at.slice(0, 10);
    byDay.set(day, Number(row.value));
  }

  return Array.from(byDay.entries()).map(([date, value]) => ({ date, value }));
}
