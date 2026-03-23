import React from "react";
import "../styles/ResultsPage.css";

export default function ResultCard({ excursion, onDetails }) {
  return (
    <div className="excCard resultsExcCard">
      <div className="excCardHeader">
        <div className="excCardTitle">
          {excursion.excursion_name || `Ekskurzija #${excursion.id}`}
        </div>

        <div className="excCardActions">
          <button
            type="button"
            className="excIconBtn"
            onClick={() => onDetails(excursion.id)}
          >
            Detalji
          </button>
        </div>
      </div>

      <div className="excCardMeta resultsExcCardMeta">
        <div className="resultsMetaRow">
          <span className="excLabel">Ukupni rezultat:</span>
          <span className="excValue">
            {excursion.total_score} / {excursion.total_questions}
          </span>
        </div>

        <div className="resultsMetaRow">
          <span className="excLabel">Riješene lokacije:</span>
          <span className="excValue">
            {excursion.solved_geofences_count} /{" "}
            {excursion.total_geofences_count}
          </span>
        </div>
      </div>
    </div>
  );
}
