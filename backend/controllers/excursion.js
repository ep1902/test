const pool = require("../db");

async function createExcursion(req, res) {
  try {
    const { name, password, user_id } = req.body || {};

    if (!name || !password || !user_id) {
      return res
        .status(400)
        .json({ error: "name, password i user_id su obavezni." });
    }

    const result = await pool.query(
      `INSERT INTO excursions (name, password, user_id)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, password, user_id],
    );

    const excursionId = result.rows[0].id;

    return res.status(201).json({ id: excursionId });
  } catch (e) {
    console.error("createExcursion error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function getExcursionsForUser(req, res) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Neispravan userId." });
    }

    const result = await pool.query(
      `SELECT id, name, password, created_at
       FROM excursions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return res.json(result.rows);
  } catch (e) {
    console.error("getExcursionsByUser error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function editExcursion(req, res) {
  try {
    const { name, password, excursionId } = req.body || {};
    const id = Number(excursionId);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID ekskurzije." });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name je obavezan." });
    }

    if (typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ error: "Password je obavezan." });
    }

    const result = await pool.query(
      `UPDATE excursions
       SET name = $1, password = $2
       WHERE id = $3
       RETURNING id, name, password, user_id, created_at`,
      [name.trim(), password.trim(), id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Ekskurzija nije pronađena." });
    }

    return res.json(result.rows[0]);
  } catch (e) {
    console.error("updateExcursion error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function deleteExcursionById(req, res) {
  try {
    const id = Number(req.params.excursionId);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID." });
    }

    const result = await pool.query(
      `DELETE FROM excursions
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

async function joinExcursion(req, res) {
  try {
    const { name, password, user_id } = req.body || {};

    if (!name || !password || !user_id) {
      return res.status(400).json({
        error: "name, password i user_id su obavezni.",
      });
    }

    const r = await pool.query(
      `
      SELECT id, name, active
      FROM excursions
      WHERE name = $1 AND password = $2
      LIMIT 1;
      `,
      [name, password],
    );

    if (r.rowCount === 0) {
      return res.status(404).json({
        error: "Ekskurzija ne postoji ili su podaci neispravni.",
      });
    }

    const exc = r.rows[0];

    const isActive = exc.active === true || exc.active === 1;

    if (!isActive) {
      return res.status(409).json({
        error: "Ekskurzija postoji, ali trenutno nije aktivna.",
        id: exc.id,
      });
    }

    const memberResult = await pool.query(
      `
      INSERT INTO excursion_members (excursion_id, user_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (excursion_id, user_id)
      DO UPDATE SET status = 'active'
      RETURNING *;
      `,
      [exc.id, user_id],
    );

    return res.json({
      ok: true,
      id: exc.id,
      member: memberResult.rows[0],
    });
  } catch (e) {
    console.error("joinExcursion error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

module.exports = {
  createExcursion,
  getExcursionsForUser,
  editExcursion,
  deleteExcursionById,
  joinExcursion,
};
