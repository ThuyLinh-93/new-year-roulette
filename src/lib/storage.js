const DRAW_STATE_KEY = "roulette_draw_state_v1";
export function loadHistory(user) {
  if (!user) return [];
  try {
    const key = `roulette_history_${user.provider}_${user.id}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}
export function saveHistory(user, history) {
  if (!user) return;
  try {
    const key = `roulette_history_${user.provider}_${user.id}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error(error);
  }
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
  try {
    localStorage.setItem(DRAW_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error(error);
  }
}
