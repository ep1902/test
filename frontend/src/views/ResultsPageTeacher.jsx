import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TeacherExcursionCard from "../components/TeacherExcursionCard";
import UserResultsCard from "../components/UserResultsCard";
import DetailsCard from "../components/DetailsCard";
import "../styles/ResultsPage.css";
import "../styles/home.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function ResultsPageTeacher() {
  const [excursions, setExcursions] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [details, setDetails] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [error, setError] = useState("");
  const [selectedExcursion, setSelectedExcursion] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = Number(searchParams.get("userId"));

  useEffect(() => {
    fetchTeacherExcursions();
  }, []);

  const fetchTeacherExcursions = async () => {
    try {
      setLoadingList(true);
      setError("");

      const response = await fetch(`${API_BASE}/all/results?userId=${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Error fetching professor's excursions.",
        );
      }

      setExcursions(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching professor's excursions.");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchExcursionUsers = async (excursion) => {
    try {
      setLoadingUsers(true);
      setError("");
      setSelectedExcursion(excursion);
      setSelectedStudentId(null);
      setDetails(null);

      const response = await fetch(
        `${API_BASE}/all/results/${excursion.id}/users?userId=${userId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error fetching user results.");
      }

      setUserResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching user results.");
      setSelectedExcursion(null);
      setUserResults([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    if (!selectedExcursion) return;

    try {
      setLoadingDetails(true);
      setError("");
      setSelectedStudentId(studentId);

      const response = await fetch(
        `${API_BASE}/results/${selectedExcursion.id}?userId=${studentId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Error fetching students result details.",
        );
      }

      setDetails(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching students result details.");
      setSelectedStudentId(null);
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackFromDetails = () => {
    setSelectedStudentId(null);
    setDetails(null);
    setError("");
  };

  const handleBackFromUsers = () => {
    setSelectedExcursion(null);
    setSelectedStudentId(null);
    setUserResults([]);
    setDetails(null);
    setError("");
  };

  const backHome = () => {
    navigate(`/home`);
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
        {!selectedExcursion ? (
          <>
            <div className="post-login-card results-hero-card">
              <div className="post-login-content">
                <h1 className="post-login-title">Results of my excursions</h1>
                <p className="post-login-description">
                  Here you can review the excursions you have created, see the
                  results of all students, and open a detailed view by location.
                </p>
              </div>
            </div>

            <div className="excursions-list-card">
              <div className="excursions-list-header">
                <h3 className="excursions-list-title">My excursions</h3>
                <div className="excursions-list-count">
                  {excursions.length} total
                </div>
              </div>

              {loadingList ? (
                <div className="excursions-empty">Loading excursions...</div>
              ) : excursions.length === 0 ? (
                <div className="excursions-empty">
                  There are no excursions with at least one associated user.
                </div>
              ) : (
                <div className="excursions-grid">
                  {excursions.map((excursion) => (
                    <TeacherExcursionCard
                      key={excursion.id}
                      excursion={excursion}
                      onDetails={fetchExcursionUsers}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : !selectedStudentId ? (
          <div className="excursions-list-card">
            <div className="excursions-list-header results-details-header">
              <div>
                <h3 className="excursions-list-title">
                  Students for excursion: {selectedExcursion.excursion_name}
                </h3>
                <div className="excursions-list-count">
                  {userResults.length} total
                </div>
              </div>

              <button
                type="button"
                className="create-excursion-cancel-button"
                onClick={handleBackFromUsers}
              >
                Close
              </button>
            </div>

            {loadingUsers ? (
              <div className="excursions-empty">Loading users...</div>
            ) : userResults.length === 0 ? (
              <div className="excursions-empty">
                There are no users for this excursion.
              </div>
            ) : (
              <div className="excursions-grid">
                {userResults.map((userResult) => (
                  <UserResultsCard
                    key={userResult.user_id}
                    userResult={userResult}
                    onDetails={fetchStudentDetails}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <DetailsCard
            details={details}
            loading={loadingDetails}
            onBack={handleBackFromDetails}
          />
        )}
      </div>
    </div>
  );
}
