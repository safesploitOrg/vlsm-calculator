export const STORAGE_KEY = 'vlsm-calculator:form-state:v1';
export const STORAGE_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export function saveCalculatorState(storage, state, now = Date.now()) {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({
      expiresAt: now + STORAGE_TTL_MS,
      state
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadCalculatorState(storage, now = Date.now()) {
  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const saved = JSON.parse(rawValue);
    if (!saved || typeof saved.state !== 'object' || saved.state === null ||
        !Number.isFinite(saved.expiresAt) || saved.expiresAt <= now) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }

    return saved.state;
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable because of browser privacy settings.
    }
    return null;
  }
}

export function clearCalculatorState(storage) {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
