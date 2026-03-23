import React, { useEffect, useMemo, useState } from "react";
import { GoogleMap, CircleF, useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import "../styles/createGeofences.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const DEFAULT_POS = { lat: 45.815, lng: 15.9819 };

export default function GeofenceManager() {
  const navigate = useNavigate();
  const [mapInstance, setMapInstance] = useState(null);

  const [draftCenter, setDraftCenter] = useState(null);
  const [draftRadius, setDraftRadius] = useState(200);
  const [draftName, setDraftName] = useState("Moj geofence");
  const [draftDesc, setDraftDesc] = useState("Opis");

  const [geofences, setGeofences] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  });

  const [searchParams] = useSearchParams();
  const excursionId = Number(searchParams.get("excursionId"));

  const selectedGeofence = geofences.find((g) => g.id === selectedId) || null;

  const mapCenter = useMemo(() => {
    if (draftCenter) return draftCenter;

    if (selectedGeofence) {
      return {
        lat: Number(selectedGeofence.latitude),
        lng: Number(selectedGeofence.longitude),
      };
    }

    return DEFAULT_POS;
  }, [draftCenter, selectedGeofence]);

  async function refreshGeofences() {
    if (!Number.isFinite(excursionId)) return;

    const r = await fetch(
      `${API_BASE}/all/geofences?excursionId=${excursionId}`,
    );

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e.error || "Greška pri dohvaćanju geofenceova.");
      return;
    }

    const data = await r.json();
    setGeofences(data);

    if (data.length && selectedId == null) {
      setSelectedId(data[0].id);
    }

    if (selectedId != null && !data.some((g) => g.id === selectedId)) {
      setSelectedId(data[0]?.id ?? null);
    }
  }

  useEffect(() => {
    refreshGeofences().catch(() => {});
  }, [excursionId]);

  function panToPosition(pos) {
    if (mapInstance && pos) mapInstance.panTo(pos);
  }

  async function saveGeofence() {
    if (!draftCenter) {
      alert("Prvo klikni na kartu da odabereš centar geofencea.");
      return;
    }

    if (!Number.isFinite(excursionId)) {
      alert("Nedostaje excursionId u URL-u (npr. /geofences?excursionId=123).");
      return;
    }

    const payload = {
      excursion_id: excursionId,
      name: draftName,
      description: draftDesc,
      latitude: draftCenter.lat,
      longitude: draftCenter.lng,
      radius_m: Number(draftRadius),
    };

    const r = await fetch(`${API_BASE}/save/geofence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e.error || "Greška pri spremanju geofencea.");
      return;
    }

    const created = await r.json();

    await refreshGeofences();
    if (created?.id) setSelectedId(created.id);
  }

  async function deleteGeofence(id) {
    const r = await fetch(`${API_BASE}/delete/geofence/${id}`, {
      method: "DELETE",
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e.error || "Greška pri brisanju geofencea.");
      return;
    }

    await refreshGeofences();
  }

  async function questions(g) {
    const params = new URLSearchParams({
      geofenceId: g.id,
      geofenceName: g.name,
    });
    navigate(`/questions?${params.toString()}`);
  }

  if (!Number.isFinite(excursionId)) {
    return (
      <div style={{ padding: 24 }}>
        Nedostaje ili je neispravan <code>excursionId</code> u URL-u. Primjer:{" "}
        <code>/geofences?excursionId=20</code>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 24 }}>Greška pri učitavanju Maps API-ja.</div>
    );
  }

  if (!isLoaded) {
    return <div style={{ padding: 24 }}>Učitavam kartu…</div>;
  }

  function handleBack() {
    navigate(`/home`, { replace: true });
  }

  return (
    <div className="gmLayout">
      <div className="gmSidebar">
        <div className="gmCard">
          <div className="gmHeader">
            <div>
              <h2 className="gmTitle">Geofence manager</h2>

              <div className="gmSubtitle">
                Dodaj novi geofence ili odaberi postojeći.
              </div>
            </div>
          </div>

          <div className="gmSectionTitle">Novi geofence</div>

          <div className="gmForm">
            <div className="gmField">
              <div className="gmLabel">Naziv</div>
              <input
                className="gmInput"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Npr. Start zona"
              />
            </div>

            <div className="gmField">
              <div className="gmLabel">Opis</div>
              <input
                className="gmInput"
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                placeholder="Kratki opis (opcionalno)"
              />
            </div>

            <div className="gmField">
              <div className="gmLabel">Radius (metri)</div>
              <input
                className="gmInput"
                type="number"
                min="1"
                max="100000"
                value={draftRadius}
                onChange={(e) => setDraftRadius(e.target.value)}
              />
            </div>

            <div className="gmCenterBox">
              <div className="gmCenterTitle">Centar</div>
              <div className="gmMono">
                {draftCenter
                  ? `${draftCenter.lat.toFixed(6)}, ${draftCenter.lng.toFixed(6)}`
                  : "Klikni na kartu da odabereš centar"}
              </div>
            </div>

            <button className="gmPrimaryBtn" onClick={saveGeofence}>
              Spremi geofence
            </button>
            <button className="gmBackBtn" onClick={handleBack}>
              Povratak
            </button>
          </div>

          <div className="gmDivider" />

          <div className="gmListHeader">
            <div className="gmSectionTitle gmSectionTitleNoMargin">
              Spremljeni geofenceovi
            </div>
            <div className="gmCount">{geofences.length} ukupno</div>
          </div>

          {geofences.length === 0 ? (
            <div className="gmEmpty">Nema spremljenih geofenceova.</div>
          ) : (
            <div className="gmList">
              {geofences.map((g) => {
                const isSelected = g.id === selectedId;
                const c = { lat: Number(g.latitude), lng: Number(g.longitude) };

                return (
                  <div
                    key={g.id}
                    className={`gmItem ${isSelected ? "isSelected" : ""}`}
                  >
                    <div className="gmItemRow">
                      <button
                        className="gmItemBtn"
                        onClick={() => {
                          setSelectedId(g.id);
                          setDraftCenter(c);
                          setDraftRadius(Number(g.radius_m));
                          setDraftName(g.name);
                          setDraftDesc(g.description || "");
                        }}
                      >
                        {g.name}
                      </button>

                      <button
                        className="gmDeleteBtn"
                        onClick={() => questions(g)}
                        title="Obriši"
                      >
                        Pitanja
                      </button>

                      <button
                        className="gmDeleteBtn"
                        onClick={() => deleteGeofence(g.id)}
                        title="Obriši"
                      >
                        Obriši
                      </button>
                    </div>

                    <div className="gmMeta">
                      <div className="gmMono">
                        {Number(g.latitude).toFixed(5)},{" "}
                        {Number(g.longitude).toFixed(5)} · {g.radius_m} m
                      </div>

                      {g.description ? (
                        <div className="gmDesc">{g.description}</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="gmMapWrap">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={13}
          onLoad={(map) => setMapInstance(map)}
          onClick={(e) => {
            const lat = e.latLng?.lat();
            const lng = e.latLng?.lng();

            if (typeof lat === "number" && typeof lng === "number") {
              setDraftCenter({ lat, lng });
            }
          }}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {draftCenter && (
            <CircleF
              center={draftCenter}
              radius={Number(draftRadius)}
              options={{
                fillOpacity: 0.12,
                strokeOpacity: 0.8,
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
                fillOpacity: g.id === selectedId ? 0.15 : 0.07,
                strokeOpacity: g.id === selectedId ? 0.95 : 0.5,
                clickable: false,
              }}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}
