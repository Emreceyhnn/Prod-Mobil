import AsyncStorage from "@react-native-async-storage/async-storage";

const QUICK_BUTTONS_KEY = "@vela/quick_expense_buttons";

const DEFAULT_BUTTONS = [
  { id: "default-coffee", label: "Kahve", emoji: "☕", amount: 150, category: "Market & Restoran" },
  { id: "default-transport", label: "Metro & Otobüs", emoji: "🚌", amount: 27, category: "Ulaşım & Yakıt" },
];

export async function getQuickButtons() {
  const raw = await AsyncStorage.getItem(QUICK_BUTTONS_KEY);
  if (!raw) return DEFAULT_BUTTONS;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BUTTONS;
  }
}

export async function saveQuickButtons(buttons) {
  await AsyncStorage.setItem(QUICK_BUTTONS_KEY, JSON.stringify(buttons));
}

export async function addQuickButton(button) {
  const current = await getQuickButtons();
  const next = [...current, { ...button, id: `btn-${Date.now()}` }];
  await saveQuickButtons(next);
  return next;
}

export async function removeQuickButton(id) {
  const current = await getQuickButtons();
  const next = current.filter((b) => b.id !== id);
  await saveQuickButtons(next);
  return next;
}
