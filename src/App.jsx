import { useEffect, useMemo, useRef, useState } from "react";
import AuthPanel from "./components/AuthPanel";
import HistoryPanel from "./components/HistoryPanel";
import RouletteBoard from "./components/RouletteBoard";
import { PRIZES, WHEEL_SLOTS, getUserKey, ADMIN_EMAIL } from "./lib/constants";
import {
  clearGoogleSession,
  getEnv,
  isConfiguredGoogle,
  isConfiguredKakao,
  loadGoogleSession,
  loadScript,
  parseJwt,
  saveGoogleSession,
} from "./lib/auth";
import { loadHistory, saveHistory } from "./lib/storage";
import { supabase } from "./lib/supabase";
const KAKAO_SDK_URL = "https://developers.kakao.com/sdk/js/kakao.js";
const MIN_SPIN_DURATION_MS = 4000;
const MAX_SPIN_DURATION_MS = 5000;
function normalizeAngle(deg) {
  return ((deg % 360) + 360) % 360;
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle(list) {
  const copied = [...list];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}
function makeWheelSlots() {
  const shuffled = shuffle(WHEEL_SLOTS);
  return [...shuffle(shuffled.slice(0, 4)), ...shuffle(shuffled.slice(4))];
}
function makeWheelColors(count) {
  return Array.from({ length: count }, (_, index) => (index % 2 === 0 ? "#c9152b" : "#fffaf6"));
}
function toKakaoUser(profile) {
  return {
    provider: "Kakao",
    id: String(profile.id),
    name: profile?.kakao_account?.profile?.nickname || profile?.properties?.nickname || "",
    email: profile?.kakao_account?.email || "",
  };
}
function toGoogleUser(jwtPayload) {
  return {
    provider: "Google",
    id: String(jwtPayload.sub),
    name: jwtPayload.name || "",
    email: jwtPayload.email || "",
  };
}
function App() {
  const spinTimerRef = useRef(null);
  const [status, setStatus] = useState("로그인 상태를 확인하는 중...");
  const [user, setUser] = useState(null);
  const [participants, setParticipants] = useState(() => {
    try {
      const raw = localStorage.getItem('roulette_participants_v2');
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error(error);
      return [];
    }
  });
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDurationMs, setSpinDurationMs] = useState(3500);
  const [lastResult, setLastResult] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalResult, setModalResult] = useState("");
  const [wheelSlots] = useState(() => makeWheelSlots());
  const [wheelColors] = useState(() => makeWheelColors(8));
  const { kakaoJsKey, googleClientId } = useMemo(() => getEnv(), []);
  const kakaoEnabled = isConfiguredKakao(kakaoJsKey);
  const googleEnabled = isConfiguredGoogle(googleClientId);
  const sortedParticipants = useMemo(
    () => [...participants].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [participants],
  );
  const userParticipation = useMemo(() => {
    return null;
  }, [user]);
  const canSpin = Boolean(user) && !isSpinning;
  const isAdmin = useMemo(() => {
    return user?.email === ADMIN_EMAIL;
  }, [user]);
  const revealAllResults = true;
  const showHistoryPanel = (Boolean(lastResult) && participants.length > 0) || (isAdmin && participants.length > 0);
  const spinHint = useMemo(() => {
    if (!user) return "로그인 후 참여할 수 있습니다.";
    if (isSpinning) return "룰렛이 돌아가는 중...";
    if (isAdmin) return `관리자 모드 - 총 ${participants.length}명 참여 완료`;
    return `총 ${participants.length}명 참여 완료`;
  }, [participants.length, user, isSpinning, isAdmin]);
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        window.clearTimeout(spinTimerRef.current);
      }
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      try {
        if (kakaoEnabled) {
          await loadScript(KAKAO_SDK_URL);
          if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(kakaoJsKey);
          }
        }
        if (kakaoEnabled && window.Kakao?.Auth?.getAccessToken()) {
          const kakaoProfile = await new Promise((resolve, reject) => {
            window.Kakao.API.request({
              url: "/v2/user/me",
              success: resolve,
              fail: reject,
            });
          });
          if (!mounted) return;
          const kakaoUser = toKakaoUser(kakaoProfile);
          setUser(kakaoUser);
          setStatus("Kakao 계정으로 로그인되었습니다.");
          return;
        }
        const savedGoogleUser = loadGoogleSession();
        if (savedGoogleUser && mounted) {
          setUser(savedGoogleUser);
          setStatus("Google 계정으로 로그인되었습니다.");
          return;
        }
        if (!mounted) return;
        if (!kakaoEnabled && !googleEnabled) {
          setStatus(".env에 카카오/구글 키를 설정하세요.");
        } else {
          setStatus("로그인 후 룰렛에 참여할 수 있습니다.");
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setStatus("인증 초기화 중 오류가 발생했습니다.");
        }
      }
    }
    initAuth();
    return () => {
      mounted = false;
    };
  }, [googleEnabled, kakaoEnabled, kakaoJsKey]);
  useEffect(() => {
    if (!user) {
      setLastResult("");
      return;
    }
    setLastResult("");
  }, [user]);
  const handleLoginKakao = () => {
    if (!window.Kakao?.Auth || !kakaoEnabled) {
      setStatus("카카오 키를 확인하세요.");
      return;
    }
    window.Kakao.Auth.login({
      scope: "profile_nickname,account_email",
      success: async () => {
        try {
          clearGoogleSession();
          const profile = await new Promise((resolve, reject) => {
            window.Kakao.API.request({
              url: "/v2/user/me",
              success: resolve,
              fail: reject,
            });
          });
          const kakaoUser = toKakaoUser(profile);
          setUser(kakaoUser);
          setStatus("Kakao 계정으로 로그인되었습니다.");
        } catch (error) {
          console.error(error);
          setStatus("카카오 로그인 후 프로필 조회에 실패했습니다.");
        }
      },
      fail: (error) => {
        console.error(error);
        setStatus("카카오 로그인에 실패했습니다.");
      },
    });
  };
  const handleGoogleSuccess = (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        setStatus("구글 로그인 응답이 비어 있습니다. 설정을 다시 확인해주세요.");
        return;
      }
      clearGoogleSession();
      const payload = parseJwt(credentialResponse.credential);
      const googleUser = toGoogleUser(payload);
      saveGoogleSession(googleUser);
      setUser(googleUser);
      setStatus("Google 계정으로 로그인되었습니다.");
    } catch (error) {
      console.error(error);
      setStatus("구글 로그인 처리 중 오류가 발생했습니다.");
    }
  };
  const handleGoogleError = () => {
    setStatus("구글 로그인에 실패했습니다. 브라우저 설정(쿠키/추적차단/확장프로그램)도 확인해주세요.");
  };
  const handleLogout = () => {
    if (window.Kakao?.Auth?.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        setUser(null);
        setStatus("로그아웃되었습니다.");
      });
      return;
    }
    if (user?.provider === "Google") {
      clearGoogleSession();
      setUser(null);
      setStatus("로그아웃되었습니다.");
      return;
    }
    setUser(null);
    setStatus("로그아웃되었습니다.");
  };
  const handleReset = async () => {
    if (!isAdmin) return;
    
    if (window.confirm('정말로 모든 참여자 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        // Supabase에서 모든 데이터 삭제
        const { error } = await supabase
          .from('participants')
          .delete()
          .neq('id', 0);
        
        if (error) throw error;
        
        // 로컬 상태도 초기화
        localStorage.removeItem('roulette_participants_v2');
        localStorage.removeItem('roulette_draw_state_v1');
        setParticipants([]);
        setLastResult("");
        setStatus("모든 참여자 기록이 초기화되었습니다.");
      } catch (error) {
        console.error('Failed to reset participants:', error);
        setStatus("초기화 중 오류가 발생했습니다: " + error.message);
      }
    }
  };
  const handleSpin = () => {
    if (!user || isSpinning) return;
    const userKey = getUserKey(user);
    
    const selectedPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    const candidateSlotIndices = wheelSlots.map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot === selectedPrize)
      .map(({ index }) => index);
    const selectedSlotIndex =
      candidateSlotIndices[Math.floor(Math.random() * candidateSlotIndices.length)];
    const segment = 360 / wheelSlots.length;
    const segmentCenter = selectedSlotIndex * segment + segment / 2;
    const targetAtTop = 0;
    const currentNormalized = normalizeAngle(rotation);
    const delta = normalizeAngle(targetAtTop - segmentCenter - currentNormalized);
    const nextRotation = rotation + 2160 + delta;
    const nextSpinDuration = randomInt(MIN_SPIN_DURATION_MS, MAX_SPIN_DURATION_MS);
    setSpinDurationMs(nextSpinDuration);
    setIsSpinning(true);
    setRotation(nextRotation);
    spinTimerRef.current = window.setTimeout(() => {
      const now = new Date().toISOString();
      const nextResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        mission: selectedPrize,
        createdAt: now,
      };
      const nextParticipant = {
        userKey,
        provider: user.provider,
        userId: user.id,
        name: user.name,
        email: user.email,
        result: selectedPrize,
        createdAt: now,
      };
      const updatedParticipants = [...participants, nextParticipant];
      setParticipants(updatedParticipants);
      
      try {
        localStorage.setItem('roulette_participants_v2', JSON.stringify(updatedParticipants));
      } catch (error) {
        console.error('Failed to save participants:', error);
      }
      const previousHistory = loadHistory(user);
      saveHistory(user, [...previousHistory, nextResult]);
      setLastResult(selectedPrize);
      setModalResult(selectedPrize);
      setShowResultModal(true);
      setIsSpinning(false);
      setStatus(
        `참여 완료: ${selectedPrize} 당첨 (총 ${updatedParticipants.length}명 참여)`,
      );
    }, nextSpinDuration);
  };
  return (
    <main className="page">
      <section className="hero-card">
        <div className="festival-deco" aria-hidden="true">
          <span className="deco-badge swing">🧧</span>
          <span className="deco-badge swing delay-1">복</span>
          <span className="deco-badge swing delay-2">🐇</span>
        </div>
        <div className="top-header">
          <p className="chip">2026 NEW YEAR</p>
          {user && (
            <div className="top-user">
              <span className="top-user-name">{user.name || "사용자"}님</span>
              {isAdmin && (
                <button 
                  className="btn danger" 
                  type="button" 
                  onClick={handleReset}
                  style={{ marginRight: '10px', backgroundColor: '#ff4444', color: 'white' }}
                >
                  전체 초기화
                </button>
              )}
              <button className="btn ghost top-logout" type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          )}
        </div>
        <h1>신년 소망 룰렛</h1>
        <p className="subtitle">
          설날 분위기의 소망 룰렛입니다. 참여 인원 제한 없이 누구나 참여 가능하며, 결과는 중복될 수 있습니다.
        </p>
        <AuthPanel
          status={status}
          user={user}
          kakaoEnabled={kakaoEnabled}
          googleEnabled={googleEnabled}
          showGoogleLogin={googleEnabled}
          onLoginKakao={handleLoginKakao}
          onGoogleSuccess={handleGoogleSuccess}
          onGoogleError={handleGoogleError}
        />
        <div className={`main-grid ${showHistoryPanel ? "has-history" : "solo"}`}>
          <RouletteBoard
            missions={wheelSlots}
            segmentColors={wheelColors}
            rotation={rotation}
            isSpinning={isSpinning}
            lastResult={lastResult}
            canSpin={canSpin}
            onSpin={handleSpin}
            spinHint={spinHint}
            spinDurationMs={spinDurationMs}
            revealLabels={Boolean(lastResult)}
          />
          {showHistoryPanel && (
            <HistoryPanel participants={sortedParticipants} revealResults={true} />
          )}
        </div>
        {showResultModal && (
          <div className="result-modal-backdrop" role="dialog" aria-modal="true" aria-label="룰렛 결과">
            <div className="result-modal">
              <div className="pouch-scene" aria-hidden="true">
                <div className="pouch-knot" />
                <div className="pouch-top" />
                <div className="pouch-body">
                  <span className="pouch-mark">복</span>
                </div>
                <div className="pouch-spark s1">✨</div>
                <div className="pouch-spark s2">🎉</div>
                <div className="pouch-spark s3">✨</div>
              </div>
              <p className="result-modal-title">복주머니를 열어보니…</p>
              <p className="result-modal-amount">{modalResult}</p>
              <button className="btn kakao" type="button" onClick={() => setShowResultModal(false)}>
                확인
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
export default App;
