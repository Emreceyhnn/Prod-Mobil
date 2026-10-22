import { Platform } from "react-native";
import AppleHealthKit from "react-native-health";
import { supabase } from "./supabase";

const PERMS = AppleHealthKit.Constants.Permissions;

const HEALTH_PERMISSIONS = {
  permissions: {
    read: [
      PERMS.StepCount,
      PERMS.HeartRate,
      PERMS.Weight,
      PERMS.BodyFatPercentage,
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
  const results = { weight: null, steps: null, activeEnergy: null, bodyFat: null, errors: [] };

  try {
    const weight = await getLatestWeight();
    if (weight?.value) {
      await syncHealthMetricToSupabase(userId, "weight", weight.value, "kg");
      results.weight = weight.value;
    }
  } catch (e) {
    results.errors.push("weight: " + e.message);
  }

  try {
    const steps = await getTodayStepCount();
    if (steps?.value != null) {
      await syncHealthMetricToSupabase(userId, "steps", steps.value, "count");
      results.steps = steps.value;
    }
  } catch (e) {
    results.errors.push("steps: " + e.message);
  }

  try {
    const activeEnergy = await getTodayActiveEnergyBurned();
    if (activeEnergy != null) {
      await syncHealthMetricToSupabase(userId, "active_energy", activeEnergy, "kcal");
      results.activeEnergy = activeEnergy;
    }
  } catch (e) {
    results.errors.push("active_energy: " + e.message);
  }

  try {
    const bodyFat = await getLatestBodyFatPercentage();
    if (bodyFat?.value) {
      await syncHealthMetricToSupabase(userId, "body_fat", bodyFat.value * 100, "%");
      results.bodyFat = bodyFat.value * 100;
    }
  } catch (e) {
    results.errors.push("body_fat: " + e.message);
  }

  return results;
}

/**
 * Health ekranında gösterilecek güncel metrikleri HealthKit'ten
 * doğrudan okur (Supabase'e yazmadan, yalnızca UI için).
 */
export async function fetchCurrentHealthSnapshot() {
  const snapshot = { weight: null, steps: null, activeEnergy: null, bodyFat: null, heartRate: null };

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
    getHeartRateSamples().then((samples) => {
      snapshot.heartRate = samples?.[0]?.value ?? null;
    }),
  ]);

  return snapshot;
}
