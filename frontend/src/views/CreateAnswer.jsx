import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/home.css";
import AnswerCard from "../components/AnswerCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export default function CreateAnswer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const questionId = searchParams.get("questionId");
  const questionText = searchParams.get("questionText");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [mode, setMode] = useState("default");
  const [editingAnswer, setEditingAnswer] = useState(null);

  const [answerForm, setAnswerForm] = useState({
    answer_text: "",
    is_correct: false,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    setToken(storedToken);

    if (!storedToken) {
      navigate("/login", { replace: true });
      return;
    }

    if (!questionId) {
      setErr("Nedostaje questionId u URL-u.");
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
  }, [navigate, questionId]);

  async function loadAnswers() {
    if (!token || !questionId) return;

    try {
      const r = await fetch(
        `${API_BASE}/all/answers?questionId=${questionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Ne mogu dohvatiti odgovore.");
      }

      const data = await r.json();
      setAnswers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  useEffect(() => {
    if (token && questionId) {
      loadAnswers();
    }
  }, [token, questionId]);

  function handleCreateAnswer() {
    setMode("create");
    setEditingAnswer(null);
    setAnswerForm({
      answer_text: "",
      is_correct: false,
    });
  }

  function handleCancelForm() {
    setMode("default");
    setEditingAnswer(null);
    setAnswerForm({
      answer_text: "",
      is_correct: false,
    });
  }

  function handleAnswerChange(e) {
    const { name, value, type, checked } = e.target;
    setAnswerForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleEditAnswer(answer) {
    setMode("edit");
    setEditingAnswer(answer);
    setAnswerForm({
      answer_text: answer.answer_text || "",
      is_correct: !!answer.is_correct,
    });
  }

  async function handleDeleteAnswer(answer) {
    if (!window.confirm(`Obrisati odgovor "${answer.answer_text}"?`)) {
      return;
    }

    try {
      const r = await fetch(`${API_BASE}/answers/delete/${answer.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        alert(e.error || "Greška pri brisanju odgovora.");
        return;
      }

      await loadAnswers();

      if (mode === "edit" && editingAnswer?.id === answer.id) {
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
        const r = await fetch(`${API_BASE}/answers/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: Number(questionId),
            text: answerForm.answer_text,
            is_correct: answerForm.is_correct,
          }),
        });

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          alert(err.error || "Greška pri kreiranju odgovora.");
          return;
        }

        await loadAnswers();
        handleCancelForm();
        return;
      }

      if (mode === "edit" && editingAnswer?.id) {
        const r = await fetch(`${API_BASE}/answers/edit`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answerId: editingAnswer.id,
            text: answerForm.answer_text,
            is_correct: answerForm.is_correct,
          }),
        });

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          alert(err.error || "Greška pri ažuriranju odgovora.");
          return;
        }

        await loadAnswers();
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

  if (loading) {
    return (
      <div className="page">
        <div className="card">Loading your data…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="card">User not loaded.</div>
      </div>
    );
  }

  return (
    <div className="post-login-page">
      <button className="profile-button-fixed" onClick={profile}>
        Profile
      </button>

      <button className="logout-button-fixed" onClick={logout}>
        Logout
      </button>

      {(mode === "create" || mode === "edit") && (
        <div className="create-excursion-wrapper">
          <div className="create-excursion-card">
            <h2 className="create-excursion-title">
              {mode === "create" ? "Create Answer" : "Edit Answer"}
            </h2>

            <p className="create-excursion-description">
              {mode === "create"
                ? "Enter a new answer for the selected question."
                : "Update existing answer."}
            </p>

            <form onSubmit={handleFormSubmit} className="create-excursion-form">
              <div className="create-excursion-field">
                <label htmlFor="answer_text" className="create-excursion-label">
                  Answer Text
                </label>
                <textarea
                  id="answer_text"
                  name="answer_text"
                  value={answerForm.answer_text}
                  onChange={handleAnswerChange}
                  className="create-excursion-input"
                  placeholder="Unesi tekst odgovora"
                  required
                  rows={4}
                />
              </div>

              <div className="create-excursion-field">
                <label
                  htmlFor="is_correct"
                  className="create-excursion-label"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <input
                    id="is_correct"
                    name="is_correct"
                    type="checkbox"
                    checked={answerForm.is_correct}
                    onChange={handleAnswerChange}
                  />
                  Correct answer
                </label>
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
                  {mode === "create" ? "Save Answer" : "Save Changes"}
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
                Answers for question
                <br />
                {questionText}
              </h1>
              <p className="post-login-description">
                Here you can create, edit and delete answers for the selected
                question. One answer can be marked as correct.
              </p>
            </div>

            <div className="post-login-actions" style={{ gap: "10px" }}>
              <button
                onClick={goBack}
                className="create-excursion-cancel-button"
              >
                Back
              </button>

              <button
                onClick={handleCreateAnswer}
                className="create-excursion-button"
              >
                Create Answer
              </button>
            </div>
          </div>

          <div className="excursions-list-card">
            <div className="excursions-list-header">
              <h3 className="excursions-list-title">Answers created</h3>
              <div className="excursions-list-count">
                {answers.length} total
              </div>
            </div>

            {answers.length === 0 ? (
              <div className="excursions-empty">
                No answers have been created.
              </div>
            ) : (
              <div className="excursions-grid">
                {answers.map((answer) => (
                  <AnswerCard
                    key={answer.id}
                    answer={answer}
                    onEdit={handleEditAnswer}
                    onDelete={handleDeleteAnswer}
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
