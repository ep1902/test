import React from "react";
import "../styles/ResultsPage.css";

export default function DetailsCard({ details, loading, onBack }) {
  return (
    <div className="excursions-list-card results-details-card">
      <div className="excursions-list-header results-details-header">
        <h3 className="excursions-list-title">Detalji ekskurzije</h3>
        <button
          type="button"
          className="create-excursion-cancel-button"
          onClick={onBack}
        >
          Zatvori
        </button>
      </div>

      {loading ? (
        <div className="excursions-empty">Učitavanje detalja...</div>
      ) : !details || !details.summary ? (
        <div className="excursions-empty">Detalji nisu dostupni.</div>
      ) : (
        <>
          <div className="excCard resultsSummaryCard">
            <div className="excCardHeader">
              <div className="excCardTitle">
                {details.summary.excursion_name ||
                  `Ekskurzija #${details.summary.id}`}
              </div>
            </div>

            <div className="excCardMeta resultsExcCardMeta">
              <div className="resultsMetaRow">
                <span className="excLabel">Ukupni rezultat:</span>
                <span className="excValue">
                  {details.summary.total_score} /{" "}
                  {details.summary.total_questions}
                </span>
              </div>
            </div>
          </div>

          {details.geofences?.length === 0 ? (
            <div className="excursions-empty">
              Nema dostupnih detalja za ovu ekskurziju.
            </div>
          ) : (
            <div className="results-table-wrapper">
              <table className="results-table-clean">
                <thead>
                  <tr>
                    <th>Lokacija</th>
                    <th>Rezultat</th>
                    <th>Broj pitanja</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {details.geofences.map((item) => (
                    <tr key={item.id}>
                      <td>{item.geofence_name || `Lokacija #${item.id}`}</td>
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
                          {item.already_solved ? "Riješeno" : "Nije riješeno"}
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
