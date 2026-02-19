import React from "react";

function RouletteBoard({
  missions,
  segmentColors,
  rotation,
  isSpinning,
  lastResult,
  canSpin,
  onSpin,
  spinHint,
  spinDurationMs,
  revealLabels,
}) {
  const step = 360 / missions.length;
  const gradient = segmentColors
    .map((color, index) => `${color} ${index * step}deg ${(index + 1) * step}deg`)
    .join(", ");

  return (
    <section className="roulette-box">
      <h2 className="section-title">금액 룰렛</h2>
      <div className="wheel-wrap">
        <div className="pointer" />
        <div className="wheel-frame" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, index) => {
            const lightAngle = (360 / 16) * index;
            const lightRadius = 175;
            const rad = ((lightAngle - 90) * Math.PI) / 180;
            const x = Math.cos(rad) * lightRadius;
            const y = Math.sin(rad) * lightRadius;
            return (
              <span
                key={`light-${index}`}
                className={`frame-light ${index % 2 === 0 ? "warm" : "hot"}`}
                style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              />
            );
          })}
        </div>
        <div
          className="wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: `${spinDurationMs}ms`,
            backgroundImage: `conic-gradient(${gradient})`,
          }}
        >
          {missions.map((mission, index) => {
            const angle = index * step + step / 2;
            const radius = 118;
            const rad = ((angle - 90) * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;

            return (
              <span
                key={`${mission}-${index}`}
                className="wheel-label"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {revealLabels ? mission : <span className="coin-icon">₩</span>}
              </span>
            );
          })}
        </div>
        <button className="wheel-start-btn" type="button" onClick={onSpin} disabled={!canSpin || isSpinning}>
          {isSpinning ? "SPIN" : "START"}
        </button>
      </div>
      <p className="result">{lastResult ? `당첨 금액: ${lastResult}` : "아직 결과가 없습니다."}</p>
      <p className="empty">{spinHint}</p>
    </section>
  );
}

export default RouletteBoard;
