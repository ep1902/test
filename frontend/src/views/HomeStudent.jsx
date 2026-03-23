import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export default function HomeStudent() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [mode, setMode] = useState("default");

  const [excursionForm, setExcursionForm] = useState({
    name: "",
    password: "",
  });

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    setToken(t);

    if (!t) {
      navigate("/login", { replace: true });
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
            Authorization: `Bearer ${t}`,
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
  }, [navigate]);

  function handleJoinExcursion() {
    setMode("join");
    setExcursionForm({ name: "", password: "" });
  }

  function handleCancelForm() {
    setMode("default");
    setExcursionForm({ name: "", password: "" });
  }

  function handleExcursionChange(e) {
    const { name, value } = e.target;
    setExcursionForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    try {
      const r = await fetch(`${API_BASE}/excursions/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: excursionForm.name,
          password: excursionForm.password,
          user_id: user.id,
        }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        if (r.status === 409) {
          alert(data.error || "Ekskurzija postoji, ali trenutno nije aktivna.");
          return;
        }

        if (r.status === 404) {
          alert(
            data.error || "Ekskurzija ne postoji ili su podaci neispravni.",
          );
          return;
        }

        if (r.status === 400) {
          alert(data.error || "Nedostaju podaci (name/password).");
          return;
        }

        alert(data.error || "Greška pri pridruživanju ekskurziji.");
        return;
      }

      const excursionId = data?.id;

      if (!excursionId) {
        alert("Backend nije vratio id ekskurzije.");
        return;
      }
      const params = new URLSearchParams({
        user: user.id,
        excursion: excursionId,
      });
      navigate(`/student/map?${params.toString()}`);
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

  function results() {
    navigate(`/results?userId=${user.id}`, { replace: true });
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">Učitavam tvoje podatke…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="post-login-page">
      <button className="results-button-fixed" onClick={results}>
        Results
      </button>

      <button className="profile-button-fixed" onClick={profile}>
        Profile
      </button>

      <button className="logout-button-fixed" onClick={logout}>
        Odjava
      </button>

      {err && <div className="dashboard-error">{err}</div>}

      {mode === "join" && (
        <div className="create-excursion-wrapper">
          <div className="create-excursion-card">
            <h2 className="create-excursion-title">Join Excursion</h2>
            <p className="create-excursion-description">
              Enter the excursion name and password to join an existing
              excursion.
            </p>

            <form onSubmit={handleFormSubmit} className="create-excursion-form">
              <div className="create-excursion-field">
                <label htmlFor="name" className="create-excursion-label">
                  Excursion Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={excursionForm.name}
                  onChange={handleExcursionChange}
                  className="create-excursion-input"
                  placeholder="Enter excursion name"
                  required
                />
              </div>

              <div className="create-excursion-field">
                <label htmlFor="password" className="create-excursion-label">
                  Excursion Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={excursionForm.password}
                  onChange={handleExcursionChange}
                  className="create-excursion-input"
                  placeholder="Enter excursion password"
                  required
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
                  Join
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
                Welcome, {user.firstName || user.name || "korisniče"}
              </h1>
              <p className="post-login-description">
                You are successfully logged in. From here you can join an
                existing excursion.
              </p>
            </div>

            <div className="post-login-actions">
              <button
                onClick={handleJoinExcursion}
                className="create-excursion-button"
              >
                Join Excursion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
