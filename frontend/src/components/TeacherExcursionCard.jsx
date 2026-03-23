import React from "react";
import "../styles/ResultsPage.css";

export default function TeacherExcursionCard({ excursion, onDetails }) {
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
            onClick={() => onDetails(excursion)}
          >
            Prikaži učenike
          </button>
        </div>
      </div>

      <div className="excCardMeta resultsExcCardMeta">
        <div className="resultsMetaRow">
          <span className="excLabel">Broj prijavljenih korisnika:</span>
          <span className="excValue">{excursion.joined_users_count}</span>
        </div>

        <div className="resultsMetaRow">
          <span className="excLabel">Lokacije s kvizom:</span>
          <span className="excValue">{excursion.total_geofences_count}</span>
        </div>

        <div className="resultsMetaRow">
          <span className="excLabel">Ukupno pitanja:</span>
          <span className="excValue">{excursion.total_questions}</span>
        </div>
      </div>
    </div>
  );
}
