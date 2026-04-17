const pool = require("../db");

async function getQuiz(req, res) {
  try {
    const geofenceId = Number(req.query.geofenceId);
    const userId = Number(req.query.userId);

    if (!Number.isFinite(geofenceId)) {
      return res
        .status(400)
        .json({ error: "geofenceId je obavezan i mora biti broj." });
    }

    if (!Number.isFinite(userId)) {
      return res
        .status(400)
        .json({ error: "userId je obavezan i mora biti broj." });
    }

    const attemptResult = await pool.query(
      `
      SELECT score, total_questions
      FROM quiz_attempts
      WHERE user_id = $1 AND geofence_id = $2
      LIMIT 1
      `,
      [userId, geofenceId],
    );

    if (attemptResult.rows.length > 0) {
      const attempt = attemptResult.rows[0];

      return res.json({
        alreadySolved: true,
        score: attempt.score,
        totalQuestions: attempt.total_questions,
        message: "Korisnik je već riješio taj kviz.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        q.id AS question_id,
        q.question_text,
        a.id AS answer_id,
        a.answer_text,
        a.is_correct
      FROM questions q
      LEFT JOIN answers a ON a.question_id = q.id
      WHERE q.geofence_id = $1
      ORDER BY q.id ASC, a.id ASC
      `,
      [geofenceId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Nema pitanja za zadani geofenceId.",
      });
    }

    const grouped = {};

    for (const row of result.rows) {
      if (!grouped[row.question_id]) {
        grouped[row.question_id] = {
          id: row.question_id,
          question: row.question_text,
          options: [],
        };
      }

      if (row.answer_id) {
        grouped[row.question_id].options.push({
          id: row.answer_id,
          text: row.answer_text,
        });
      }
    }

    const questions = Object.values(grouped);

    return res.json({
      alreadySolved: false,
      geofenceId,
      questions,
    });
  } catch (e) {
    console.error("getQuiz error:", e);
    return res.status(500).json({ error: "Server error." });
  }
}

async function submitQuiz(req, res) {
  try {
    const geofenceId = Number(req.body.geofenceId);
    const answers = req.body.answers;
    const userId = Number(req.body.userId);

    if (!Number.isFinite(geofenceId)) {
      return res.status(400).json({
        error: "geofenceId je obavezan i mora biti broj.",
      });
    }

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return res.status(400).json({
        error: "answers su obavezni i moraju biti objekt.",
      });
    }

    const questionIds = Object.keys(answers).map(Number);

    if (questionIds.length === 0) {
      return res.status(400).json({
        error: "Nema poslanih odgovora.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        q.id AS question_id,
        a.id AS answer_id,
        a.is_correct
      FROM questions q
      JOIN answers a ON a.question_id = q.id
      WHERE q.geofence_id = $1
        AND q.id = ANY($2::int[])
      `,
      [geofenceId, questionIds],
    );

    const correctAnswersMap = {};

    for (const row of result.rows) {
      if (row.is_correct === true) {
        correctAnswersMap[row.question_id] = Number(row.answer_id);
      }
    }

    let score = 0;

    for (const questionId of questionIds) {
      const selectedAnswerId = Number(answers[questionId]);
      const correctAnswerId = correctAnswersMap[questionId];

      if (selectedAnswerId === correctAnswerId) {
        score++;
      }
    }

    const r = await pool.query(
      `INSERT INTO quiz_attempts (user_id, geofence_id, score, total_questions)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, geofenceId, score, questionIds.length],
    );

    return res.json({
      score,
      totalQuestions: questionIds.length,
    });
  } catch (e) {
    console.error("submitQuiz error:", e);
    return res.status(500).json({
      error: "Server error.",
      details: e.message,
    });
  }
}

async function hasQuiz(req, res) {
  try {
    const geofenceId = Number(req.query.geofenceId);

    const result = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM questions WHERE geofence_id = $1
       )`,
      [geofenceId],
    );

    res.json({ hasQuiz: result.rows[0].exists });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getQuiz,
  submitQuiz,
  hasQuiz,
};
