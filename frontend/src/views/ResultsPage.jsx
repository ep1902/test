import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ResultCard from "../components/ResultCard";
import DetailsCard from "../components/DetailsCard";
import "../styles/ResultsPage.css";
import "../styles/home.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function ResultsPage() {
  const [excursions, setExcursions] = useState([]);
  const [details, setDetails] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");
  const [selectedExcursionId, setSelectedExcursionId] = useState(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = Number(searchParams.get("userId"));

  useEffect(() => {
    fetchMyResults();
  }, []);

  const fetchMyResults = async () => {
    try {
      setLoadingList(true);
      setError("");

      const response = await fetch(`${API_BASE}/results?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error fetching results.");
      }

      setExcursions(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching results.");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchDetails = async (excursionId) => {
    try {
      setLoadingDetails(true);
      setError("");
      setSelectedExcursionId(excursionId);

      const response = await fetch(
        `${API_BASE}/results/${excursionId}?userId=${userId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error fetching result details.");
      }

      setDetails(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching result details.");
      setSelectedExcursionId(null);
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBack = () => {
    setSelectedExcursionId(null);
    setDetails(null);
    setError("");
  };

  const backHome = () => {
    navigate(`/student/home`);
  };

  return (
    <div className="post-login-page">
      <button
        className="logout-button-fixed results-home-button"
        onClick={backHome}
      >
        Back
      </button>

      {error && (
        <div className="dashboard-error results-error-box">{error}</div>
      )}

      <div className="create-excursion-wrapper">
        {!selectedExcursionId ? (
          <>
            <div className="post-login-card results-hero-card">
              <div className="post-login-content">
                <h1 className="post-login-title">My excursion results</h1>
                <p className="post-login-description">
                  Here you can review the results of your completed excursions
                  and open a detailed view of the results by location.
                </p>
              </div>
            </div>

            <div className="excursions-list-card">
              <div className="excursions-list-header">
                <h3 className="excursions-list-title">Completed excursions</h3>
                <div className="excursions-list-count">
                  {excursions.length} total
                </div>
              </div>

              {loadingList ? (
                <div className="excursions-empty">Loading results...</div>
              ) : excursions.length === 0 ? (
                <div className="excursions-empty">No results available.</div>
              ) : (
                <div className="excursions-grid">
                  {excursions.map((excursion) => (
                    <ResultCard
                      key={excursion.id}
                      excursion={excursion}
                      onDetails={fetchDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <DetailsCard
            details={details}
            loading={loadingDetails}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
