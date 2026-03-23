import React from "react";
import "../styles/ResultsPage.css";

export default function UserResultsCard({ userResult, onDetails }) {
  return (
    <div className="excCard resultsExcCard">
      <div className="excCardHeader">
        <div className="excCardTitle">
          {userResult.username || `Korisnik #${userResult.user_id}`}
        </div>

        <div className="excCardActions">
          <button
            type="button"
            className="excIconBtn"
            onClick={() => onDetails(userResult.user_id)}
          >
            Detalji
          </button>
        </div>
      </div>

      <div className="excCardMeta resultsExcCardMeta">
        <div className="resultsMetaRow">
          <span className="excLabel">Ukupni rezultat:</span>
          <span className="excValue">
            {userResult.total_score} / {userResult.total_questions}
          </span>
        </div>

        <div className="resultsMetaRow">
          <span className="excLabel">Riješene lokacije:</span>
          <span className="excValue">
            {userResult.solved_geofences_count} /{" "}
            {userResult.total_geofences_count}
          </span>
        </div>
      </div>
    </div>
  );
}
