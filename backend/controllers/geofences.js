let geofences = [];
let nextGeofenceId = 1;
const pool = require("../db");

async function getAllGeofences(req, res) {
  try {
    const excursionId = Number(req.query.excursionId);

    if (!Number.isFinite(excursionId)) {
      return res
        .status(400)
        .json({ error: "excursionId je obavezan i mora biti broj." });
    }

    const result = await pool.query(
      `SELECT id, excursion_id, name, description, latitude, longitude, radius_m, created_at
       FROM geolocations
       WHERE excursion_id = $1
       ORDER BY created_at DESC`,
      [excursionId],
    );

    return res.json(result.rows);
  } catch (e) {
    console.error("getAllGeofences2 error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function createGeofence(req, res) {
  try {
    const { excursion_id, name, description, latitude, longitude, radius_m } =
      req.body || {};

    const result = await pool.query(
      `INSERT INTO geolocations (excursion_id, name, description, latitude, longitude, radius_m)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        excursion_id,
        name.trim(),
        description ?? null,
        latitude,
        longitude,
        Math.trunc(radius_m),
      ],
    );

    if (!result.rows?.length) {
      return res
        .status(500)
        .json({ error: "Insert nije vratio id (RETURNING)." });
    }

    return res.status(201).json({ id: result.rows[0].id });
  } catch (e) {
    console.error("createGeofence error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function deleteGeofenceById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID." });
    }

    const result = await pool.query(
      `DELETE FROM geolocations
       WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Geofence nije pronađen." });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteGeofenceById error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

module.exports = {
  getAllGeofences,
  createGeofence,
  deleteGeofenceById,
};
