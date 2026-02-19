# 신년 롤렛 (Vite + React)

카카오/구글 SSO 로그인 후, 실제 룰렛 회전 애니메이션과 랜덤 결과를 제공하는 웹앱입니다.
로그인한 사용자별 결과 이력과 전역 추첨 상태는 `localStorage`에 저장됩니다.

## 주요 기능

- 카카오 로그인 (Kakao JS SDK)
- 구글 로그인 (Google Identity Services)
- 룰렛 항목: `1,000원`, `2,000원`, `5,000원`, `10,000원`
- 룰렛 회전 시간: 3~4초 랜덤
- 같은 계정 1회 참여 제한
- 참여 인원 3명 제한, 3명의 결과는 중복 없이 배정
- 사용자별 결과 이력 저장 (`provider + userId` 기준)

## 실행 방법

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 파일 생성

```bash
cp .env.example .env
```

3. `.env` 값 설정

```env
VITE_KAKAO_JS_KEY=실제_카카오_JS_키
VITE_GOOGLE_CLIENT_ID=실제_구글_CLIENT_ID
```

4. 개발 서버 실행

```bash
npm run dev
```

## 콘솔 설정 체크리스트

### 카카오

- 카카오 개발자 콘솔 > 내 애플리케이션 > 플랫폼 > Web 등록
- 로컬 테스트 시 `http://localhost:5173` 등록
- 필요한 동의 항목(닉네임/이메일) 활성화

### 구글

- Google Cloud Console > OAuth 2.0 Client ID(Web) 생성
- Authorized JavaScript origins에 `http://localhost:5173` 등록
- 생성한 Client ID를 `.env`의 `VITE_GOOGLE_CLIENT_ID`에 입력

## 저장 방식

- 사용자 기록 키: `roulette_history_{provider}_{userId}`
- 전역 추첨 상태 키: `roulette_draw_state_v1`
- 항목: 당첨 금액, 생성 시각, 참여자 목록, 사용된 금액 목록
