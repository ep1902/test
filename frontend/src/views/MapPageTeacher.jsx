import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  MarkerF,
  CircleF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../styles/map.css";
import InfoPopupCard from "../components/InfoPopupCard";
import UserActivityPopup from "../components/UserActivityPopup";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const DEFAULT_POS = { lat: 45.815, lng: 15.9819 };
const MOVE_STEP = 0.0005;
const MAIN_GEOFENCE_RADIUS = 500;

function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function MapPageTeacher() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const qpUserId = searchParams.get("user") || "";
  const qpExcursion = searchParams.get("excursion") || "";

  const userIdRef = useRef(qpUserId);

  useEffect(() => {
    userIdRef.current = qpUserId;
  }, [qpUserId]);

  const previousInsideMainRef = useRef({});
  const prevInsideByGeofenceRef = useRef(new Map());

  const [myPos, setMyPos] = useState(null);
  const [geoErr, setGeoErr] = useState("");

  const [users, setUsers] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);

  const [geofencePopup, setGeofencePopup] = useState(null);
  const closeGeofencePopup = () => setGeofencePopup(null);

  const [usersPopupOpen, setUsersPopupOpen] = useState(false);
  const [usersPopupData, setUsersPopupData] = useState(null);
  const [usersPopupLoading, setUsersPopupLoading] = useState(false);
  const [usersPopupError, setUsersPopupError] = useState("");

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  });

  const mapCenter = useMemo(() => myPos || DEFAULT_POS, [myPos]);

  const mainUser = users.find((u) => u.isMain) || null;
  const me = users.find((u) => u.userId === userIdRef.current) || null;
  const isMainUser = !!me?.isMain;

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoErr("Geolocation nije podržan u ovom browseru.");
      setMyPos(DEFAULT_POS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoErr("");
      },
      (err) => {
        setGeoErr(err.message || "Ne mogu dohvatiti lokaciju.");
        setMyPos(DEFAULT_POS);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  }, []);

  async function handleEndExcursion(exc) {
    const resp = await fetch(`${API_BASE}/end/excursion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        excursionId: qpExcursion,
        userId: qpUserId,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("Neuspješno postavljanje active=true:", err);

      return;
    }

    navigate(`/home`);
  }

  async function refreshUsers() {
    const r = await fetch(`${API_BASE}/all/locations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        excursionId: qpExcursion,
      }),
    });

    const data = await r.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  async function openUsersPopup() {
    if (!qpExcursion) return;

    setUsersPopupOpen(true);
    setUsersPopupLoading(true);
    setUsersPopupError("");
    setUsersPopupData(null);

    try {
      const r = await fetch(`${API_BASE}/excursions/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excursionId: qpExcursion }),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        setUsersPopupError(data.error || "Greška pri dohvaćanju korisnika.");
        return;
      }

      setUsersPopupData({
        active: Array.isArray(data.active) ? data.active : [],
        inactive: Array.isArray(data.inactive) ? data.inactive : [],
      });
    } catch (e) {
      setUsersPopupError("Network/Server greška.");
    } finally {
      setUsersPopupLoading(false);
    }
  }

  async function refreshGeofences() {
    if (!qpExcursion) return;
    const r = await fetch(
      `${API_BASE}/all/geofences?excursionId=${encodeURIComponent(qpExcursion)}`,
    );
    if (!r.ok) throw new Error("Ne mogu dohvatiti geofenceove.");
    const data = await r.json();
    setGeofences(Array.isArray(data) ? data : []);
  }

  async function setMainUserFromQuery() {
    const userId = userIdRef.current;
    if (!userId) return;

    const r = await fetch(`${API_BASE}/set/main-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excursionId: qpExcursion, userId: userId }),
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      console.warn(e.error || "Ne mogu postaviti glavnog korisnika.");
    }
  }

  useEffect(() => {
    if (!qpUserId) return;
    setMainUserFromQuery()
      .then(() => refreshUsers().catch(() => {}))
      .catch(() => {});
  }, [qpUserId]);

  useEffect(() => {
    refreshGeofences().catch(() => {});
  }, [qpExcursion]);

  useEffect(() => {
    prevInsideByGeofenceRef.current = new Map();
  }, [qpExcursion]);

  useEffect(() => {
    refreshUsers().catch(() => {});
    const id = setInterval(() => refreshUsers().catch(() => {}), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!myPos) return;
    const userId = userIdRef.current;
    if (!userId) return;

    fetch(`${API_BASE}/save/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        excursionId: qpExcursion,
        userId: userId,
        position: myPos,
      }),
    }).catch(() => {});
  }, [myPos]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const refreshRealLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGeoErr("");
        },
        (err) => {
          setGeoErr(err.message || "Ne mogu dohvatiti lokaciju.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        },
      );
    };

    const intervalId = setInterval(refreshRealLocation, 5000);

    return () => clearInterval(intervalId);
  }, []);

  function panToPosition(pos) {
    if (mapInstance && pos) mapInstance.panTo(pos);
  }

  function moveMyPosition(deltaLat, deltaLng) {
    setMyPos((prev) => {
      const base = prev || DEFAULT_POS;
      const next = { lat: base.lat + deltaLat, lng: base.lng + deltaLng };
      panToPosition(next);
      return next;
    });
  }

  const moveUp = () => moveMyPosition(MOVE_STEP, 0);
  const moveDown = () => moveMyPosition(-MOVE_STEP, 0);
  const moveLeft = () => moveMyPosition(0, -MOVE_STEP);
  const moveRight = () => moveMyPosition(0, MOVE_STEP);

  useEffect(() => {
    if (!mainUser || !isMainUser) {
      previousInsideMainRef.current = {};
      return;
    }

    const nextState = {};

    users.forEach((u) => {
      if (u.userId === mainUser.userId) return;

      const isInside =
        distanceMeters(u.position, mainUser.position) <= MAIN_GEOFENCE_RADIUS;
      nextState[u.userId] = isInside;

      const previous = previousInsideMainRef.current[u.userId];
      if (previous === undefined) return;

      if (previous !== isInside) {
        alert(
          isInside
            ? `Korisnik ${u.userId} je UŠAO u tvoj glavni geofence.`
            : `Korisnik ${u.userId} je IZAŠAO iz tvog glavnog geofencea.`,
        );
      }
    });

    previousInsideMainRef.current = nextState;
  }, [users, mainUser, isMainUser]);

  useEffect(() => {
    if (!myPos || !Array.isArray(geofences) || geofences.length === 0) return;

    for (const g of geofences) {
      const id = g.id ?? g.geofenceId ?? g._id;
      if (!id) continue;

      const center = { lat: Number(g.latitude), lng: Number(g.longitude) };
      const radius = Number(g.radius_m);

      if (
        !Number.isFinite(center.lat) ||
        !Number.isFinite(center.lng) ||
        !Number.isFinite(radius) ||
        radius <= 0
      ) {
        continue;
      }

      const inside = distanceMeters(myPos, center) <= radius;
      const prev = prevInsideByGeofenceRef.current.get(id);

      if (prev === undefined) {
        prevInsideByGeofenceRef.current.set(id, inside);
        continue;
      }

      if (prev !== inside) {
        const title = g.name ?? `Geofence ${id}`;
        const desc = g.description ?? "";
        setGeofencePopup({
          title,
          desc,
          inside,
          at: Date.now(),
        });
        prevInsideByGeofenceRef.current.set(id, inside);
      }
    }
  }, [myPos, geofences]);

  if (loadError)
    return <div className="mv-loading">Greška pri učitavanju Maps API-ja.</div>;
  if (!isLoaded) return <div className="mv-loading">Učitavam kartu…</div>;

  return (
    <div className="mv-layout">
      <div className="mv-sidebar">
        <h2 className="mv-title">Map</h2>

        <div className="mv-block">
          <strong>Moja lokacija:</strong>
          <div className="mv-mono">
            {myPos
              ? `${myPos.lat.toFixed(6)}, ${myPos.lng.toFixed(6)}`
              : "nije dostupno"}
          </div>
          {geoErr && <div className="mv-error">Geolocation: {geoErr}</div>}
        </div>

        <hr className="mv-hr" />

        <div className="mv-block">
          <strong>Korisnici:</strong> <span>{users.length}</span>
        </div>
        <button onClick={openUsersPopup} className="excIconBtn quiz-btn">
          Korisnici
        </button>

        <div className="mv-block">
          <strong>Geofenceovi:</strong> <span>{geofences.length}</span>
        </div>
        <button
          type="button"
          className="excIconBtn danger"
          onClick={(e) => {
            handleEndExcursion();
          }}
        >
          End
        </button>
      </div>

      <div className="mv-mapWrap">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={13}
          onLoad={(map) => setMapInstance(map)}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {users
            .filter(
              (u) =>
                u?.position &&
                typeof u.position.lat === "number" &&
                typeof u.position.lng === "number",
            )
            .map((u) => (
              <MarkerF
                key={u.userId}
                position={u.position}
                title={u.isMain ? `${u.userId} (GLAVNI)` : u.userId}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: u.isMain ? "#2563eb" : "#ef4444",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }}
              />
            ))}

          {mainUser?.position && (
            <CircleF
              center={mainUser.position}
              radius={MAIN_GEOFENCE_RADIUS}
              options={{
                fillOpacity: 0.12,
                strokeOpacity: 0.9,
                clickable: false,
              }}
            />
          )}

          {geofences.map((g) => (
            <CircleF
              key={g.id}
              center={{ lat: Number(g.latitude), lng: Number(g.longitude) }}
              radius={Number(g.radius_m)}
              options={{
                fillOpacity: 0.07,
                strokeOpacity: 0.5,
                clickable: false,
              }}
            />
          ))}
        </GoogleMap>
      </div>
      <InfoPopupCard
        open={!!geofencePopup}
        data={geofencePopup}
        onClose={closeGeofencePopup}
      />
      <UserActivityPopup
        open={usersPopupOpen}
        data={usersPopupData}
        loading={usersPopupLoading}
        error={usersPopupError}
        onClose={() => setUsersPopupOpen(false)}
      />
    </div>
  );
}
