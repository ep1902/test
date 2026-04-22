import React, { useEffect } from "react";
import "../styles/infoPopupCard.css";

export default function InfoPopupCard({ open, data, onClose }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !data) return null;

  const statusText = data.inside ? "ENTERED" : "EXITED";
  const timeText = new Date(data.at).toLocaleTimeString();

  return (
    <div
      className="gf-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="gf-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="gf-modal-top">
          <div className="gf-modal-title">{data.title}</div>

          <button
            className="gf-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {data.desc ? (
          <div className="gf-desc">
            <div className="gf-row-label">Description</div>
            <div className="gf-desc-text">{data.desc}</div>
          </div>
        ) : null}

        <div className="gf-row">
          <span className="gf-row-label">Status</span>
          <span className="gf-row-value">{statusText}</span>
        </div>

        <div className="gf-row">
          <span className="gf-row-label">Time</span>
          <span className="gf-row-value">{timeText}</span>
        </div>

        <div className="gf-modal-actions">
          <button className="gf-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
