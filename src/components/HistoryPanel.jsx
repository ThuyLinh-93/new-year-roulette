import React from "react";

function formatDate(iso) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskResult(result, revealResults) {
  if (revealResults) return result;
  return "????";
}

function HistoryPanel({ participants, revealResults }) {
  return (
    <section className="history-box">
      <h2 className="section-title">참여자 명단</h2>
      {participants.length === 0 ? (
        <p className="empty">아직 참여자가 없습니다.</p>
      ) : (
        <ol className="history-list">
          {participants.map((participant) => (
            <li key={participant.userKey}>
              <strong>{participant.name || "이름 비공개"}</strong>
              <br />
              <span>결과: {maskResult(participant.result, revealResults)}</span>
              <br />
              <span>{formatDate(participant.createdAt)}</span>
            </li>
          ))}
        </ol>
      )}
      {!revealResults && (
        <p className="empty">본인 참여 완료 후 전체 결과가 공개됩니다.</p>
      )}
    </section>
  );
}

export default HistoryPanel;
