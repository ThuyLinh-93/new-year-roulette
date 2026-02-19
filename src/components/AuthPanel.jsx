import React from "react";
import { GoogleLogin } from "@react-oauth/google";

function AuthPanel({
  status,
  user,
  kakaoEnabled,
  googleEnabled,
  showGoogleLogin,
  onLoginKakao,
  onGoogleSuccess,
  onGoogleError,
}) {
  return (
    <div className="auth-panel" aria-live="polite">
      <p className="status">{status}</p>
      {!user && (
        <div className="actions">
          <button
            className="btn kakao"
            type="button"
            onClick={onLoginKakao}
            disabled={!kakaoEnabled}
            title={kakaoEnabled ? "" : "카카오 키를 설정하세요."}
          >
            카카오로 시작하기
          </button>

          {showGoogleLogin ? (
            <div className="google-wrap">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={onGoogleError}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="230"
              />
            </div>
          ) : (
            <button
              className="btn ghost"
              type="button"
              disabled={!googleEnabled}
              title={googleEnabled ? "" : "구글 Client ID를 설정하세요."}
            >
              구글 설정 확인 필요
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default AuthPanel;
