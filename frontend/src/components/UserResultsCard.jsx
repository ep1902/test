import React from "react";
import "../styles/ResultsPage.css";

export default function UserResultsCard({ userResult, onDetails }) {
  return (
    <div className="excCard resultsExcCard">
      <div className="excCardHeader">
        <div className="excCardTitle">
          {userResult.username || `User #${userResult.user_id}`}
        </div>

        <div className="excCardActions">
          <button
            type="button"
            className="excIconBtn"
            onClick={() => onDetails(userResult.user_id)}
          >
            Details
          </button>
        </div>
      </div>

      <div className="excCardMeta resultsExcCardMeta">
        <div className="resultsMetaRow">
          <span className="excLabel">Overall score:</span>
          <span className="excValue">
            {userResult.total_score} / {userResult.total_questions}
          </span>
        </div>

        <div className="resultsMetaRow">
          <span className="excLabel">Solved locations:</span>
          <span className="excValue">
            {userResult.solved_geofences_count} /{" "}
            {userResult.total_geofences_count}
          </span>
        </div>
      </div>
    </div>
  );
}
