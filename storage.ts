export const saveToStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error("Storage save error", e);
  }
};

export const loadFromStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("Storage load error", e);
    return null;
  }
};