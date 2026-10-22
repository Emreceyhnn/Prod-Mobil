// app.config.js
// Expo Development Build / EAS Build config — Expo Go'da ÇALIŞMAZ.
// HealthKit, Bluetooth ve Bildirim dinleme gibi native modüller içerdiği için
// mutlaka "npx expo prebuild" veya "eas build --profile development" ile derlenmelidir.

export default ({ config }) => ({
  ...config,
  name: "Vela",
  slug: "vela",
  owner: "emreceyhn",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  scheme: "vela",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#090D16"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.emreceyhan.vela",
    infoPlist: {
      NSHealthShareUsageDescription:
        "Vela, adım sayısı, nabız, kilo ve uyku verilerinizi okuyarak size kişisel sağlık içgörüleri sunar.",
      NSHealthUpdateUsageDescription:
        "Vela, uygulama içinde girdiğiniz sağlık verilerini (kilo, su tüketimi vb.) Apple Health ile senkronize eder.",
      NSBluetoothAlwaysUsageDescription:
        "Vela, akıllı baskül ve giyilebilir cihazlarla bağlantı kurmak için Bluetooth erişimi kullanır.",
      NSBluetoothPeripheralUsageDescription:
        "Vela, yakındaki sağlık cihazlarını (baskül, nabız bandı) taramak için Bluetooth kullanır.",
      UIBackgroundModes: ["bluetooth-central", "fetch", "remote-notification"],
      ITSAppUsesNonExemptEncryption: false
    },
    entitlements: {
      "com.apple.developer.healthkit": true,
      "com.apple.developer.healthkit.access": []
    }
  },
  android: {
    package: "com.emreceyhan.vela",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#090D16"
    },
    permissions: [
      "BLUETOOTH",
      "BLUETOOTH_ADMIN",
      "BLUETOOTH_CONNECT",
      "BLUETOOTH_SCAN",
      "ACCESS_FINE_LOCATION",
      "RECEIVE_BOOT_COMPLETED",
      "POST_NOTIFICATIONS",
      "BIND_NOTIFICATION_LISTENER_SERVICE",
      "FOREGROUND_SERVICE"
    ]
  },
  plugins: [
    "expo-dev-client",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#8B5CF6"
      }
    ],
    [
      "react-native-health",
      {
        isClinicalDataEnabled: false,
        healthSharePermission:
          "Vela, sağlık verilerinizi okumak için izin istiyor.",
        healthUpdatePermission:
          "Vela, sağlık verilerinizi güncellemek için izin istiyor."
      }
    ],
    [
      "react-native-ble-plx",
      {
        isBackgroundEnabled: true,
        modes: ["central"],
        bluetoothAlwaysPermission:
          "Vela, cihazlarla bağlantı kurmak için Bluetooth kullanır."
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "120953e4-9827-40d8-beae-cb3c6c61c77c"
    }
  }
});
