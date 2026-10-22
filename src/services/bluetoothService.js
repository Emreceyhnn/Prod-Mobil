import { useEffect, useRef, useState, useCallback } from "react";
import { Platform, PermissionsAndroid } from "react-native";
import { BleManager } from "react-native-ble-plx";

let managerInstance = null;

function getManager() {
  if (!managerInstance) {
    managerInstance = new BleManager();
  }
  return managerInstance;
}

export async function requestBluetoothPermissions() {
  if (Platform.OS !== "android") return true;

  const sdkInt = Platform.constants?.Version ?? 0;
  if (sdkInt < 31) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);

  return Object.values(results).every(
    (status) => status === PermissionsAndroid.RESULTS.GRANTED
  );
}

/**
 * Yakındaki BLE cihazlarını (akıllı baskül, nabız bandı vb.) tarayıp
 * bağlantı kurmak için kullanılan hook.
 */
export function useBluetoothDevices() {
  const manager = useRef(getManager()).current;
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [error, setError] = useState(null);

  const startScan = useCallback(async () => {
    const allowed = await requestBluetoothPermissions();
    if (!allowed) {
      setError("Bluetooth izinleri reddedildi.");
      return;
    }

    setDevices([]);
    setError(null);
    setScanning(true);

    manager.startDeviceScan(null, { allowDuplicates: false }, (scanError, device) => {
      if (scanError) {
        setError(scanError.message);
        setScanning(false);
        return;
      }
      if (device?.name) {
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setScanning(false);
    }, 10000);
  }, [manager]);

  const stopScan = useCallback(() => {
    manager.stopDeviceScan();
    setScanning(false);
  }, [manager]);

  const connectToDevice = useCallback(
    async (deviceId) => {
      try {
        const device = await manager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();
        setConnectedDevice(device);
        return device;
      } catch (e) {
        setError(e.message);
        throw e;
      }
    },
    [manager]
  );

  const disconnectDevice = useCallback(async () => {
    if (connectedDevice) {
      await manager.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
    }
  }, [connectedDevice, manager]);

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
    };
  }, [manager]);

  return {
    devices,
    scanning,
    connectedDevice,
    error,
    startScan,
    stopScan,
    connectToDevice,
    disconnectDevice,
  };
}
