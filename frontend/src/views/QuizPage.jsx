import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import QuizAnswer from "../components/QuziAnswer";
import "../styles/QuizPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);
  const [alreadySolved, setAlreadySolved] = useState(false);

  const [searchParams] = useSearchParams();
  const geofenceId = Number(searchParams.get("geofenceId"));
  const excursionId = Number(searchParams.get("excursionId"));

  useEffect(() => {
    if (!userId || !geofenceId) return;

    async function fetchQuiz() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/quiz?geofenceId=${geofenceId}&userId=${userId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error fetching quiz.");
        }

        if (data.alreadySolved) {
          setAlreadySolved(true);
          setResult({
            score: data.score,
            totalQuestions: data.totalQuestions,
          });
          setQuestions([]);
          return;
        }

        setAlreadySolved(false);
        setQuestions(data.questions || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load quiz.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [userId, geofenceId]);

  const currentQuestion = questions[currentQuestionIndex];

  function handleSelectAnswer(questionId, answerId) {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }

  async function handleSubmitQuiz() {
    try {
      const response = await fetch(`${API_BASE}/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          geofenceId,
          answers: selectedAnswers,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error submitting quiz.");
      }

      const data = await response.json();
      setResult(data);
      setQuizFinished(true);
    } catch (err) {
      console.error(err);
      setError("An error occurred while sending answers.");
    }
  }

  const token = useMemo(() => localStorage.getItem(TOKEN_KEY), []);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    async function getUserId() {
      try {
        const r = await fetch(`${API_BASE}/user`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (r.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          navigate("/login", { replace: true });
          return;
        }

        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.error || "Can't fetch user data.");
        }

        const data = await r.json();
        setUserId(data.id);
      } catch (e) {
        console.log(e);
      }
    }

    getUserId();
  }, [navigate, token]);

  function handleReturn() {
    const role = Number(localStorage.getItem("roleId"));
    const params = new URLSearchParams({
      user: userId,
      excursion: excursionId,
    });

    if (role === 1) {
      navigate(`/map?${params.toString()}`);
    } else {
      navigate(`/student/map?${params.toString()}`);
    }
  }

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-card">
          <p className="quiz-helper-text">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-page">
        <div className="quiz-card">
          <p className="quiz-error-text">{error}</p>
        </div>
      </div>
    );
  }

  if (alreadySolved) {
    return (
      <div className="quiz-page">
        <div className="quiz-card">
          <h1 className="quiz-title">Quiz already solved</h1>
          <div className="quiz-result-box">
            <p className="quiz-result-text">You've already solved that quiz.</p>
            <p className="quiz-result-text">
              You scored {result?.score} out of {result?.totalQuestions} points.
            </p>
            <div className="quiz-actions">
              <button
                type="button"
                className="quiz-primary-button"
                onClick={handleReturn}
              >
                Back to map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="quiz-page">
        <div className="quiz-card">
          <p className="quiz-helper-text">There are no questions available.</p>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="quiz-page">
        <div className="quiz-card">
          <h1 className="quiz-title">Quiz completed</h1>
          <div className="quiz-result-box">
            <p className="quiz-result-text">
              You scored {result?.score} out of {result?.totalQuestions} points.
            </p>
            <div className="quiz-actions">
              <button
                type="button"
                className="quiz-primary-button"
                onClick={handleReturn}
              >
                Back to map
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedAnswerId = selectedAnswers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="quiz-page">
      <div className="quiz-card">
        <h1 className="quiz-title">Kviz</h1>
        <p className="quiz-description">
          Choose one answer for each question and submit the quiz at the end.
        </p>

        <div className="quiz-progress">
          Question {currentQuestionIndex + 1} / {questions.length}
        </div>

        <div className="quiz-question-field">
          <label className="quiz-question-label">Question</label>
          <h2 className="quiz-question-text">{currentQuestion.question}</h2>
        </div>

        <div className="quiz-answers">
          {currentQuestion.options.map((option) => (
            <QuizAnswer
              key={option.id}
              text={option.text}
              isSelected={selectedAnswerId === option.id}
              onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
            />
          ))}
        </div>

        <div className="quiz-actions">
          <button
            type="button"
            className="quiz-secondary-button"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Back
          </button>

          {!isLastQuestion ? (
            <button
              type="button"
              className="quiz-primary-button"
              onClick={handleNextQuestion}
              disabled={!selectedAnswerId}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="quiz-primary-button"
              onClick={handleSubmitQuiz}
              disabled={!selectedAnswerId}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
