const pool = require("../db");

async function getAllAnswers(req, res) {
  try {
    const questionId = Number(req.query.questionId);

    if (!Number.isFinite(questionId)) {
      return res
        .status(400)
        .json({ error: "geofenceId je obavezan i mora biti broj." });
    }

    console.log("query:", req.query);

    const result = await pool.query(
      `SELECT *
       FROM answers
       WHERE question_id = $1`,
      [questionId],
    );
    console.log(result.rows);

    return res.json(result.rows);
  } catch (e) {
    console.error("getAllGeofences2 error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function createAnswer(req, res) {
  try {
    const { questionId, text, is_correct } = req.body || {};
    console.log(req.body);
    if (!questionId || !text) {
      return res
        .status(400)
        .json({ error: "questionId, text i is_correct su obavezni." });
    }

    const result = await pool.query(
      `INSERT INTO answers (question_id, answer_text, is_correct)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [questionId, text, is_correct],
    );

    const answerId = result.rows[0].id;

    return res.status(201).json({ id: answerId });
  } catch (e) {
    console.error("createExcursion error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function deleteAnswerById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID." });
    }

    const result = await pool.query(
      `DELETE FROM answers
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

async function editAnswer(req, res) {
  try {
    const { answerId, text, is_correct } = req.body || {};
    const id = Number(answerId);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID pitanja." });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Name je obavezan." });
    }

    if (typeof is_correct !== "boolean" || !text.trim()) {
      return res.status(400).json({ error: "Name je obavezan." });
    }

    const result = await pool.query(
      `UPDATE answers
       SET answer_text = $1, is_correct = $2
       WHERE id = $3
       RETURNING id, question_id, answer_text, is_correct`,
      [text.trim(), is_correct, id],
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
  createAnswer,
  getAllAnswers,
  deleteAnswerById,
  editAnswer,
};
