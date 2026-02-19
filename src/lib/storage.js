import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ncgqtjqmyrnayenncdjq.supabase.co';
const supabaseKey = 'sb_publishable_2VXnrdmabDXF5HGEzsyUtg_7MgH4mlj';
export const supabase = createClient(supabaseUrl, supabaseKey);
// 모든 참여자 가져오기
export async function getParticipants() {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
  return data || [];
}
// 참여자 추가
export async function addParticipant(participant) {
  const { data, error } = await supabase
    .from('participants')
    .insert([{
      user_key: participant.userKey,
      provider: participant.provider,
      user_id: participant.userId,
      name: participant.name,
      email: participant.email,
      result: participant.result,
      created_at: participant.createdAt
    }]);
  
  if (error) {
    console.error('Error adding participant:', error);
    throw error;
  }
  return data;
}
// 사용자 참여 여부 확인
export async function hasUserParticipated(userKey) {
  const { data, error } = await supabase
    .from('participants')
    .select('id')
    .eq('user_key', userKey);
  
  if (error) {
    console.error('Error checking participation:', error);
    return false;
  }
  
  return data && data.length > 0;
}
// 모든 참여자 삭제 (관리자용)
export async function resetAllParticipants() {
  const { error } = await supabase
    .from('participants')
    .delete()
    .neq('id', 0);
  
  if (error) {
    console.error('Error resetting participants:', error);
    throw error;
  }
}