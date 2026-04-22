import React from "react";
import "../styles/ResultsPage.css";

export default function TeacherExcursionCard({ excursion, onDetails }) {
  return (
    <div className="excCard resultsExcCard">
      <div className="excCardHeader">
        <div className="excCardTitle">
          {excursion.excursion_name || `Excursion #${excursion.id}`}
        </div>

        <div className="excCardActions">
          <button
            type="button"
            className="excIconBtn"
            onClick={() => onDetails(excursion)}
          >
            Show students
          </button>
        </div>
      </div>

      <div className="excCardMeta resultsExcCardMeta">
        <div className="resultsMetaRow">
          <span className="excLabel">Number of registered users:</span>
          <span className="excValue">{excursion.joined_users_count}</span>
        </div>

        <div className="resultsMetaRow">
          <span className="excLabel">Quiz locations:</span>
          <span className="excValue">{excursion.total_geofences_count}</span>
        </div>

        <div className="resultsMetaRow">
          <span className="excLabel">Total questions:</span>
          <span className="excValue">{excursion.total_questions}</span>
        </div>
      </div>
    </div>
  );
}
