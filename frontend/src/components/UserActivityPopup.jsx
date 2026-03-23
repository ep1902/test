import React, { useEffect } from "react";
import "../styles/userActivityPopup.css";

export default function UserActivityPopup({
  open,
  data,
  loading,
  error,
  onClose,
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const active = data?.active || [];
  const inactive = data?.inactive || [];

  return (
    <div
      className="xu-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="xu-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="xu-modal-top">
          <div className="xu-modal-title">Korisnici na ekskurziji</div>
          <button
            className="xu-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="xu-muted">Učitavam…</div>
        ) : error ? (
          <div className="xu-error">{error}</div>
        ) : (
          <>
            <div className="xu-section">
              <div className="xu-section-label">Aktivni ({active.length})</div>
              {active.length === 0 ? (
                <div className="xu-muted">Nema aktivnih korisnika.</div>
              ) : (
                <ul className="xu-list">
                  {active.map((u) => (
                    <li key={u.id ?? u.username} className="xu-item">
                      {u.username}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="xu-section">
              <div className="xu-section-label">
                Neaktivni ({inactive.length})
              </div>
              {inactive.length === 0 ? (
                <div className="xu-muted">Nema neaktivnih korisnika.</div>
              ) : (
                <ul className="xu-list">
                  {inactive.map((u) => (
                    <li key={u.id ?? u.username} className="xu-item">
                      {u.username}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="xu-modal-actions">
          <button className="xu-modal-btn" onClick={onClose}>
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
