const pool = require("../db");

async function getAllQuestions(req, res) {
  try {
    const geofenceId = Number(req.query.geofenceId);

    if (!Number.isFinite(geofenceId)) {
      return res
        .status(400)
        .json({ error: "geofenceId je obavezan i mora biti broj." });
    }

    console.log("query:", req.query);

    const result = await pool.query(
      `SELECT *
       FROM questions
       WHERE geofence_id = $1`,
      [geofenceId],
    );
    console.log(result.rows);

    return res.json(result.rows);
  } catch (e) {
    console.error("getAllGeofences2 error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function createQuestion(req, res) {
  try {
    const { geofenceId, text } = req.body || {};
    console.log(req.body);
    if (!geofenceId || !text) {
      return res.status(400).json({ error: "geofenceId i text su obavezni." });
    }

    const result = await pool.query(
      `INSERT INTO questions (geofence_id, question_text)
       VALUES ($1, $2)
       RETURNING id, question_text`,
      [geofenceId, text],
    );
    console.log(result.rows[0]);
    const questionId = result.rows[0].id;
    const questionText = result.rows[0].question_text;

    return res
      .status(201)
      .json({ id: questionId, question_text: questionText });
  } catch (e) {
    console.error("createExcursion error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function deleteQuestionById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID." });
    }

    const result = await pool.query(
      `DELETE FROM questions
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

async function editQuestion(req, res) {
  try {
    const { geofenceId, text } = req.body || {};
    const id = Number(geofenceId);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID pitanja." });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Name je obavezan." });
    }

    const result = await pool.query(
      `UPDATE questions
       SET question_text = $1
       WHERE id = $2
       RETURNING id, geofence_id, question_text`,
      [text.trim(), id],
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

module.exports = {
  createQuestion,
  getAllQuestions,
  deleteQuestionById,
  editQuestion,
};
