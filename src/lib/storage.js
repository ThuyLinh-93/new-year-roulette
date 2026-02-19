import { DRAW_STATE_KEY, getHistoryKey } from "./constants";

export function loadHistory(user) {
  if (!user) return [];
  try {
    const raw = localStorage.getItem(getHistoryKey(user));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export function saveHistory(user, history) {
  if (!user) return;
  localStorage.setItem(getHistoryKey(user), JSON.stringify(history));
}

export function loadDrawState() {
  try {
    const raw = localStorage.getItem(DRAW_STATE_KEY);
    if (!raw) {
      return { participants: [], usedResults: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
      usedResults: Array.isArray(parsed.usedResults) ? parsed.usedResults : [],
    };
  } catch (error) {
    console.error(error);
    return { participants: [], usedResults: [] };
  }
}

export function saveDrawState(state) {
  localStorage.setItem(DRAW_STATE_KEY, JSON.stringify(state));
}
