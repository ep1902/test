import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/home.css";
import QuestionCard from "../components/QuestionCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export default function CreateQuestion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const geofenceId = searchParams.get("geofenceId");
  const geofenceName = searchParams.get("geofenceName");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [mode, setMode] = useState("default");
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
  });

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    setToken(storedToken);

    if (!storedToken) {
      navigate("/login", { replace: true });
      return;
    }

    if (!geofenceId) {
      setErr("Nedostaje geofenceId u URL-u.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadMe() {
      try {
        setLoading(true);
        setErr("");

        const r = await fetch(`${API_BASE}/user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (r.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          navigate("/login", { replace: true });
          return;
        }

        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error || "Ne mogu dohvatiti korisničke podatke.");
        }

        const data = await r.json();
        if (!cancelled) setUser(data);
      } catch (e) {
        if (!cancelled) setErr(String(e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMe();

    return () => {
      cancelled = true;
    };
  }, [navigate, geofenceId]);

  async function loadQuestions() {
    if (!token || !geofenceId) return;

    try {
      const r = await fetch(
        `${API_BASE}/all/questions?geofenceId=${geofenceId}`,
      );

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Ne mogu dohvatiti pitanja.");
      }

      const data = await r.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  useEffect(() => {
    if (token && geofenceId) {
      loadQuestions();
    }
  }, [token, geofenceId]);

  function handleCreateQuestion() {
    setMode("create");
    setEditingQuestion(null);
    setQuestionForm({
      question_text: "",
    });
  }

  function handleCancelForm() {
    setMode("default");
    setEditingQuestion(null);
    setQuestionForm({
      question_text: "",
    });
  }

  function handleQuestionChange(e) {
    const { name, value } = e.target;
    setQuestionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleEditQuestion(question) {
    setMode("edit");
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text || "",
    });
  }

  async function handleDeleteQuestion(question) {
    if (!window.confirm(`Obrisati pitanje "${question.question_text}"?`)) {
      return;
    }

    try {
      const r = await fetch(`${API_BASE}/questions/delete/${question.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert(e.error || "Greška pri brisanju pitanja.");
        return;
      }

      await loadQuestions();

      if (mode === "edit" && editingQuestion?.id === question.id) {
        handleCancelForm();
      }
    } catch (e) {
      console.error(e);
      alert("Network/Server greška.");
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    try {
      if (mode === "create") {
        const r = await fetch(`${API_BASE}/questions/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            geofenceId: Number(geofenceId),
            text: questionForm.question_text,
          }),
        });

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          alert(err.error || "Greška pri kreiranju pitanja.");
          return;
        }

        const created = await r.json();
        if (!created?.id) {
          alert("Backend nije vratio id kreirane ekskurzije.");
          return;
        }
        console.log(created);
        const params = new URLSearchParams({
          questionId: created.id,
          questionText: created.question_text,
        });
        navigate(`/answers?${params.toString()}`);

        await loadQuestions();
        handleCancelForm();
        return;
      }

      if (mode === "edit" && editingQuestion?.id) {
        const r = await fetch(`${API_BASE}/questions/edit`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            geofenceId: editingQuestion.id,
            text: questionForm.question_text,
          }),
        });

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          alert(err.error || "Greška pri ažuriranju pitanja.");
          return;
        }

        await loadQuestions();
        handleCancelForm();
      }
    } catch (e2) {
      console.error(e2);
      alert("Network/Server greška.");
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    navigate("/login", { replace: true });
  }

  function profile() {
    navigate("/profile", { replace: true });
  }

  function goBack() {
    navigate(-1);
  }

  function openAnswers(question) {
    console.log(question);
    const params = new URLSearchParams({
      questionId: question.id,
      questionText: question.question_text,
    });
    navigate(`/answers?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">Učitavam tvoje podatke…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="card">Korisnik nije učitan.</div>
      </div>
    );
  }

  return (
    <div className="post-login-page">
      <button className="profile-button-fixed" onClick={profile}>
        Profile
      </button>

      <button className="logout-button-fixed" onClick={logout}>
        Odjava
      </button>

      {(mode === "create" || mode === "edit") && (
        <div className="create-excursion-wrapper">
          <div className="create-excursion-card">
            <h2 className="create-excursion-title">
              {mode === "create" ? "Create Question" : "Edit Question"}
            </h2>

            <p className="create-excursion-description">
              {mode === "create"
                ? "Unesi novo pitanje za odabranu geozonu."
                : "Ažuriraj postojeće pitanje."}
            </p>

            <form onSubmit={handleFormSubmit} className="create-excursion-form">
              <div className="create-excursion-field">
                <label
                  htmlFor="question_text"
                  className="create-excursion-label"
                >
                  Question Text
                </label>
                <textarea
                  id="question_text"
                  name="question_text"
                  value={questionForm.question_text}
                  onChange={handleQuestionChange}
                  className="create-excursion-input"
                  placeholder="Unesi tekst pitanja"
                  required
                  rows={4}
                />
              </div>

              <div className="create-excursion-actions">
                <button
                  type="button"
                  className="create-excursion-cancel-button"
                  onClick={handleCancelForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-excursion-submit-button"
                >
                  {mode === "create" ? "Save Question" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mode === "default" && (
        <div className="create-excursion-wrapper">
          <div className="post-login-card">
            <div className="post-login-content">
              <h1 className="post-login-title">
                Pitanja za geozonu: {geofenceName}
              </h1>
              <p className="post-login-description">
                Ovdje možeš kreirati, uređivati i brisati pitanja za odabranu
                geozonu. Kasnije možeš za svako pitanje dodati i odgovore.
              </p>
            </div>

            <div className="post-login-actions" style={{ gap: "10px" }}>
              <button
                onClick={goBack}
                className="create-excursion-cancel-button"
              >
                Nazad
              </button>

              <button
                onClick={handleCreateQuestion}
                className="create-excursion-button"
              >
                Create Question
              </button>
            </div>
          </div>

          <div className="excursions-list-card">
            <div className="excursions-list-header">
              <h3 className="excursions-list-title">Kreirana pitanja</h3>
              <div className="excursions-list-count">
                {questions.length} ukupno
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="excursions-empty">Nema kreiranih pitanja.</div>
            ) : (
              <div className="excursions-grid">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                    onOpenAnswers={openAnswers}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
