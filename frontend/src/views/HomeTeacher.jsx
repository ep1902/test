import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import ExcursionCard from "../components/ExcursionCard";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export default function HomeTeacher() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [excursions, setExcursions] = useState([]);

  const [mode, setMode] = useState("default");
  const [editingExcursion, setEditingExcursion] = useState(null);

  const [excursionForm, setExcursionForm] = useState({
    name: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    setToken(token);

    if (!token) {
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
            Authorization: `Bearer ${token}`,
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

  async function loadExcursions() {
    if (!user?.id || !token) return;

    const r = await fetch(`${API_BASE}/excursions/user/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!r.ok) return;

    const data = await r.json();
    setExcursions(data);
  }

  useEffect(() => {
    if (user?.id) {
      loadExcursions();
    }
  }, [user]);

  function handleCreateExcursion() {
    setMode("create");
    setEditingExcursion(null);
    setExcursionForm({ name: "", password: "" });
  }

  function handleCancelForm() {
    setMode("default");
    setEditingExcursion(null);
    setExcursionForm({ name: "", password: "" });
  }

  function handleExcursionChange(e) {
    const { name, value } = e.target;
    setExcursionForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleOpenExcursion(exc) {
    navigate(`/geofences?excursionId=${exc.id}`);
  }

  function handleEditExcursion(exc) {
    setMode("edit");
    setEditingExcursion(exc);
    setExcursionForm({
      name: exc.name || "",
      password: exc.password || "",
    });
  }

  async function handleStartExcursion(exc) {
    console.log(exc, user);

    const resp = await fetch(`${API_BASE}/start/excursion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        excursionId: exc.id,
        userId: user.id,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("Neuspješno postavljanje active=true:", err);

      return;
    }

    const params = new URLSearchParams({
      user: user.id,
      excursion: exc.id,
    });
    navigate(`/map?${params.toString()}`);
  }

  async function handleDeleteExcursion(exc) {
    if (!window.confirm(`Obrisati izlet "${exc.name}"?`)) return;

    const r = await fetch(`${API_BASE}/excursions/delete/${exc.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e.error || "Greška pri brisanju izleta.");
      return;
    }

    await loadExcursions();

    if (mode === "edit" && editingExcursion?.id === exc.id) {
      handleCancelForm();
    }
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    try {
      if (mode === "create") {
        const r = await fetch(`${API_BASE}/excursions/create`, {
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

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          alert(err.error || "Greška pri kreiranju ekskurzije.");
          return;
        }

        const created = await r.json();
        if (!created?.id) {
          alert("Backend nije vratio id kreirane ekskurzije.");
          return;
        }

        await loadExcursions();
        handleCancelForm();

        navigate(`/geofences?excursionId=${created.id}`);
        return;
      }

      if (mode === "edit" && editingExcursion?.id) {
        const r = await fetch(`${API_BASE}/excursions/edit`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: excursionForm.name,
            password: excursionForm.password,
            excursionId: editingExcursion.id,
          }),
        });

        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          alert(err.error || "Greška pri ažuriranju izleta.");
          return;
        }

        await loadExcursions();
        handleCancelForm();
        return;
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

  function results() {
    navigate(`/results/all?userId=${user.id}`, { replace: true });
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

      {mode === "create" && (
        <div className="create-excursion-wrapper">
          <div className="create-excursion-card">
            <h2 className="create-excursion-title">Create Excursion</h2>
            <p className="create-excursion-description">
              Enter the excursion name and password to create a new excursion.
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
                  Save Excursion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mode === "edit" && editingExcursion && (
        <div className="create-excursion-wrapper">
          <div className="create-excursion-card">
            <h2 className="create-excursion-title">Edit Excursion</h2>
            <p className="create-excursion-description">
              Update excursion name and password.
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
                  Save Changes
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
                You are successfully logged in. From here you can create a new
                excursion and start adding geolocations. Or edit/delete created
                excursion info by clicking on edit/delete buttons or edit
                geolocations for excursion by clicking on excursion card.
              </p>
            </div>

            <div className="post-login-actions">
              <button
                onClick={handleCreateExcursion}
                className="create-excursion-button"
              >
                Create Excursion
              </button>
            </div>
          </div>

          <div className="excursions-list-card">
            <div className="excursions-list-header">
              <h3 className="excursions-list-title">Moji izleti</h3>
              <div className="excursions-list-count">
                {excursions.length} ukupno
              </div>
            </div>

            {excursions.length === 0 ? (
              <div className="excursions-empty">Nema kreiranih izleta.</div>
            ) : (
              <div className="excursions-grid">
                {excursions.map((exc) => (
                  <ExcursionCard
                    key={exc.id}
                    excursion={exc}
                    onOpen={handleOpenExcursion}
                    onStart={handleStartExcursion}
                    onEdit={handleEditExcursion}
                    onDelete={handleDeleteExcursion}
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
