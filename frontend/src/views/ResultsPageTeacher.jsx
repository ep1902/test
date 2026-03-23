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
          data.message || "Greška pri dohvaćanju profesorovih ekskurzija.",
        );
      }

      setExcursions(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Greška pri dohvaćanju profesorovih ekskurzija.");
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
        throw new Error(
          data.message || "Greška pri dohvaćanju korisničkih rezultata.",
        );
      }

      setUserResults(data.results || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Greška pri dohvaćanju korisničkih rezultata.");
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
          data.message || "Greška pri dohvaćanju detalja rezultata učenika.",
        );
      }

      setDetails(data);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Greška pri dohvaćanju detalja rezultata učenika.",
      );
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
        Natrag
      </button>

      {error && (
        <div className="dashboard-error results-error-box">{error}</div>
      )}

      <div className="create-excursion-wrapper">
        {!selectedExcursion ? (
          <>
            <div className="post-login-card results-hero-card">
              <div className="post-login-content">
                <h1 className="post-login-title">Rezultati mojih ekskurzija</h1>
                <p className="post-login-description">
                  Ovdje možeš pregledati ekskurzije koje si kreirao, vidjeti
                  rezultate svih učenika i otvoriti detaljan prikaz po
                  lokacijama.
                </p>
              </div>
            </div>

            <div className="excursions-list-card">
              <div className="excursions-list-header">
                <h3 className="excursions-list-title">Moje ekskurzije</h3>
                <div className="excursions-list-count">
                  {excursions.length} ukupno
                </div>
              </div>

              {loadingList ? (
                <div className="excursions-empty">Učitavanje ekskurzija...</div>
              ) : excursions.length === 0 ? (
                <div className="excursions-empty">
                  Nema ekskurzija s barem jednim pridruženim korisnikom.
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
                  Učenici za ekskurziju: {selectedExcursion.excursion_name}
                </h3>
                <div className="excursions-list-count">
                  {userResults.length} ukupno
                </div>
              </div>

              <button
                type="button"
                className="create-excursion-cancel-button"
                onClick={handleBackFromUsers}
              >
                Zatvori
              </button>
            </div>

            {loadingUsers ? (
              <div className="excursions-empty">Učitavanje korisnika...</div>
            ) : userResults.length === 0 ? (
              <div className="excursions-empty">
                Nema korisnika za ovu ekskurziju.
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
