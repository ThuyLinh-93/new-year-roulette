export const PRIZES = ["1,000원", "2,000원", "5,000원", "10,000원"];
export const WHEEL_SLOTS = [...PRIZES, ...PRIZES];
export const MAX_PARTICIPANTS = 3;
export const GOOGLE_SESSION_KEY = "google_profile";
export const DRAW_STATE_KEY = "roulette_draw_state_v1";
// 관리자 계정
export const ADMIN_EMAIL = "superhanu93@gmail.com";
export function getHistoryKey(user) {
  return `roulette_history_${user.provider}_${user.id}`;
}
export function getUserKey(user) {
  return `${user.provider}_${user.id}`;
}
