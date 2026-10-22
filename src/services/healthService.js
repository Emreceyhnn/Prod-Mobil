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
  const results = { weight: null, steps: null, errors: [] };

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

  return results;
}
