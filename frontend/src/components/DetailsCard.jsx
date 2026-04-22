import React from "react";
import "../styles/ResultsPage.css";

export default function DetailsCard({ details, loading, onBack }) {
  return (
    <div className="excursions-list-card results-details-card">
      <div className="excursions-list-header results-details-header">
        <h3 className="excursions-list-title">Excursion details</h3>
        <button
          type="button"
          className="create-excursion-cancel-button"
          onClick={onBack}
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="excursions-empty">Loading details...</div>
      ) : !details || !details.summary ? (
        <div className="excursions-empty">Details are not available.</div>
      ) : (
        <>
          <div className="excCard resultsSummaryCard">
            <div className="excCardHeader">
              <div className="excCardTitle">
                {details.summary.excursion_name ||
                  `Excursion #${details.summary.id}`}
              </div>
            </div>

            <div className="excCardMeta resultsExcCardMeta">
              <div className="resultsMetaRow">
                <span className="excLabel">Overall score:</span>
                <span className="excValue">
                  {details.summary.total_score} /{" "}
                  {details.summary.total_questions}
                </span>
              </div>
            </div>
          </div>

          {details.geofences?.length === 0 ? (
            <div className="excursions-empty">
              There are no details available for this excursion.
            </div>
          ) : (
            <div className="results-table-wrapper">
              <table className="results-table-clean">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Result</th>
                    <th>Number of questions</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {details.geofences.map((item) => (
                    <tr key={item.id}>
                      <td>{item.geofence_name || `Location #${item.id}`}</td>
                      <td>
                        {item.score} / {item.total_questions}
                      </td>
                      <td>{item.total_questions}</td>
                      <td>
                        <span
                          className={
                            item.already_solved
                              ? "results-status-badge done"
                              : "results-status-badge pending"
                          }
                        >
                          {item.already_solved ? "Solved" : "Not resolved"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
