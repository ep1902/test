import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "auth_token";

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [err, setErr] = useState("");
  const [user, setUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });

  const token = useMemo(() => localStorage.getItem(TOKEN_KEY), []);

  useEffect(() => {
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
          headers: { Authorization: `Bearer ${token}` },
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
        if (!cancelled) {
          setUser(data);
          setForm({
            firstName: data.firstName || data.name || "",
            lastName: data.lastName || "",
            username: data.username || "",
            email: data.email || "",
          });
        }
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
  }, [navigate, token]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    navigate("/login", { replace: true });
  }

  function handleBack() {
    const role = Number(localStorage.getItem("roleId"));
    console.log(role);
    if (role === 1) {
      navigate("/home");
    } else {
      navigate("/student/home");
    }
  }

  function startEdit() {
    if (!user) return;
    setErr("");
    setIsEditing(true);
    setForm({
      firstName: user.firstName || user.name || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
    });
  }

  function cancelEdit() {
    setErr("");
    setIsEditing(false);
    if (user) {
      setForm({
        firstName: user.firstName || user.name || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
      });
    }
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function saveProfile() {
    if (!token || !user?.id) return;

    try {
      setSaving(true);
      setErr("");

      const r = await fetch(`${API_BASE}/editProfile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          firstName: form.firstName,
          lastName: form.lastName,
          username: form.username,
          email: form.email,
        }),
      });

      if (r.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        navigate("/login", { replace: true });
        return;
      }

      const json = await r.json().catch(() => null);

      if (!r.ok || json?.success === false) {
        throw new Error(json?.error || "Spremanje nije uspjelo.");
      }

      const updatedUser = json?.data?.user;
      const newToken = json?.data?.access_token;

      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
      }

      if (updatedUser) {
        setUser(updatedUser);
        setForm({
          firstName: updatedUser.firstName || "",
          lastName: updatedUser.lastName || "",
          username: updatedUser.username || "",
          email: updatedUser.email || "",
        });
      }

      setIsEditing(false);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile() {
    if (!token) return;

    const ok = window.confirm(
      "Jesi li siguran da želiš obrisati profil? Ova radnja je nepovratna.",
    );
    if (!ok) return;

    try {
      setDeleting(true);
      setErr("");

      const r = await fetch(`${API_BASE}/delete/profile/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (r.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        navigate("/login", { replace: true });
        return;
      }

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Brisanje profila nije uspjelo.");
      }

      localStorage.removeItem(TOKEN_KEY);
      navigate("/login", { replace: true });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="profilePage">
        <div className="profileCard">Učitavam tvoje podatke…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="profilePage">
        <div className="profileCard">
          <h2 className="profileTitle">Greška</h2>
          <p className="profileError">{err}</p>

          <div className="profileActionsRow">
            <button className="btn" onClick={() => window.location.reload()}>
              Pokušaj ponovno
            </button>
            <button className="btnDanger" onClick={logout}>
              Odjava
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="profilePage">
      <div className="profileCard">
        <div className="profileHeader">
          <div>
            <h1 className="profileTitle">
              Dobrodošao, {user.firstName || user.name || "korisniče"}
            </h1>
            <div className="profileSubtitle">
              Ovdje su tvoji korisnički podaci.
            </div>
          </div>

          <div className="profileActionsRow">
            <button className="btn" onClick={handleBack}>
              Povratak
            </button>
            <button className="btnDanger" onClick={logout}>
              Odjava
            </button>
          </div>
        </div>

        <hr className="profileHr" />

        <div className="profileGrid">
          <EditableInfo
            label="Username"
            name="username"
            value={isEditing ? form.username : user.username || ""}
            editable={isEditing}
            onChange={onChange}
          />

          <EditableInfo
            label="Email"
            name="email"
            value={isEditing ? form.email : user.email}
            editable={isEditing}
            type="email"
            onChange={onChange}
          />

          <EditableInfo
            label="Ime"
            name="firstName"
            value={
              isEditing ? form.firstName : user.firstName || user.name || ""
            }
            editable={isEditing}
            onChange={onChange}
          />

          <EditableInfo
            label="Prezime"
            name="lastName"
            value={isEditing ? form.lastName : user.lastName || ""}
            editable={isEditing}
            onChange={onChange}
          />
        </div>

        <div className="profileFooter">
          {!isEditing ? (
            <>
              <button className="btn" onClick={startEdit}>
                Edit profile
              </button>
              <button
                className="btnDanger"
                onClick={deleteProfile}
                disabled={deleting}
              >
                {deleting ? "Brišem..." : "Obriši profil"}
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={saveProfile} disabled={saving}>
                {saving ? "Spremam..." : "Spremi"}
              </button>
              <button className="btn" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
              <button
                className="btnDanger"
                onClick={deleteProfile}
                disabled={deleting || saving}
              >
                {deleting ? "Brišem..." : "Obriši profil"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EditableInfo({
  label,
  name,
  value,
  editable,
  onChange,
  type = "text",
}) {
  return (
    <div className="infoCard">
      <div className="infoLabel">{label}</div>

      {!editable ? (
        <div className="infoValue">{value ?? "—"}</div>
      ) : (
        <input
          className="input"
          name={name}
          value={value ?? ""}
          onChange={onChange}
          type={type}
          placeholder={label}
        />
      )}
    </div>
  );
}
