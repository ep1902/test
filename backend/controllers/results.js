const pool = require("../db");

const getMyExcursionResults = async (req, res) => {
  try {
    const userId = req.query.userId;

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.name AS excursion_name,
        COALESCE(scores.total_score, 0) AS total_score,
        COALESCE(total_questions.total_questions, 0) AS total_questions,
        COALESCE(solved_geofences.solved_count, 0) AS solved_geofences_count,
        COALESCE(all_geofences.total_geofences, 0) AS total_geofences_count
      FROM excursions e
      JOIN excursion_members em
        ON em.excursion_id = e.id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          qa.user_id,
          SUM(qa.score) AS total_score
        FROM geolocations g
        JOIN quiz_attempts qa
          ON qa.geofence_id = g.id
        WHERE EXISTS (
          SELECT 1
          FROM questions q
          WHERE q.geofence_id = g.id
        )
        GROUP BY g.excursion_id, qa.user_id
      ) scores
        ON scores.excursion_id = e.id
        AND scores.user_id = em.user_id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          COUNT(q.id) AS total_questions
        FROM geolocations g
        JOIN questions q
          ON q.geofence_id = g.id
        GROUP BY g.excursion_id
      ) total_questions
        ON total_questions.excursion_id = e.id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          qa.user_id,
          COUNT(DISTINCT qa.geofence_id) AS solved_count
        FROM geolocations g
        JOIN quiz_attempts qa
          ON qa.geofence_id = g.id
        WHERE EXISTS (
          SELECT 1
          FROM questions q
          WHERE q.geofence_id = g.id
        )
        GROUP BY g.excursion_id, qa.user_id
      ) solved_geofences
        ON solved_geofences.excursion_id = e.id
        AND solved_geofences.user_id = em.user_id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          COUNT(*) AS total_geofences
        FROM geolocations g
        WHERE EXISTS (
          SELECT 1
          FROM questions q
          WHERE q.geofence_id = g.id
        )
        GROUP BY g.excursion_id
      ) all_geofences
        ON all_geofences.excursion_id = e.id
      WHERE em.user_id = $1
        AND em.status = 'ended'
      ORDER BY e.id DESC
      `,
      [userId],
    );

    return res.status(200).json({
      success: true,
      results: result.rows,
    });
  } catch (error) {
    console.error("getMyExcursionResults error:", error);
    return res.status(500).json({
      success: false,
      message: "Greška pri dohvaćanju rezultata ekskurzija.",
    });
  }
};

const getExcursionResultDetails = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { excursionId } = req.params;

    const accessCheck = await pool.query(
      `
      SELECT e.id, e.name
      FROM excursions e
      JOIN excursion_members em
        ON em.excursion_id = e.id
      WHERE e.id = $1
        AND em.user_id = $2
        AND em.status = 'ended'
      LIMIT 1
      `,
      [excursionId, userId],
    );

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Ekskurzija nije pronađena ili korisnik nema pristup rezultatima.",
      });
    }

    const summaryResult = await pool.query(
      `
      SELECT
        e.id,
        e.name AS excursion_name,
        COALESCE(SUM(qa.score), 0) AS total_score,
        (
          SELECT COUNT(q.id)
          FROM geolocations g2
          JOIN questions q
            ON q.geofence_id = g2.id
          WHERE g2.excursion_id = e.id
        ) AS total_questions
      FROM excursions e
      JOIN excursion_members em
        ON em.excursion_id = e.id
      JOIN geolocations g
        ON g.excursion_id = e.id
      LEFT JOIN quiz_attempts qa
        ON qa.geofence_id = g.id
        AND qa.user_id = em.user_id
      WHERE e.id = $1
        AND em.user_id = $2
        AND em.status = 'ended'
        AND EXISTS (
          SELECT 1
          FROM questions q2
          WHERE q2.geofence_id = g.id
        )
      GROUP BY e.id, e.name
      `,
      [excursionId, userId],
    );

    const detailsResult = await pool.query(
      `
      SELECT
        g.id,
        g.name AS geofence_name,
        COUNT(q.id) AS total_questions,
        COALESCE(qa.score, 0) AS score,
        CASE
          WHEN qa.user_id IS NOT NULL THEN true
          ELSE false
        END AS already_solved
      FROM geolocations g
      JOIN questions q
        ON q.geofence_id = g.id
      LEFT JOIN quiz_attempts qa
        ON qa.geofence_id = g.id
        AND qa.user_id = $2
      WHERE g.excursion_id = $1
      GROUP BY g.id, g.name, qa.user_id, qa.score
      ORDER BY g.id ASC
      `,
      [excursionId, userId],
    );

    return res.status(200).json({
      success: true,
      summary: summaryResult.rows[0],
      geofences: detailsResult.rows,
    });
  } catch (error) {
    console.error("getExcursionResultDetails error:", error);
    return res.status(500).json({
      success: false,
      message: "Greška pri dohvaćanju detalja rezultata ekskurzije.",
    });
  }
};

const getAllExcursionResults = async (req, res) => {
  try {
    const teacherId = req.query.userId;

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.name AS excursion_name,
        COUNT(DISTINCT em.user_id) AS joined_users_count,
        COALESCE(total_questions.total_questions, 0) AS total_questions,
        COALESCE(all_geofences.total_geofences, 0) AS total_geofences_count
      FROM excursions e
      JOIN excursion_members em
        ON em.excursion_id = e.id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          COUNT(q.id) AS total_questions
        FROM geolocations g
        JOIN questions q
          ON q.geofence_id = g.id
        GROUP BY g.excursion_id
      ) total_questions
        ON total_questions.excursion_id = e.id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          COUNT(*) AS total_geofences
        FROM geolocations g
        WHERE EXISTS (
          SELECT 1
          FROM questions q
          WHERE q.geofence_id = g.id
        )
        GROUP BY g.excursion_id
      ) all_geofences
        ON all_geofences.excursion_id = e.id
      WHERE e.user_id = $1
        AND em.user_id <> e.user_id
      GROUP BY
        e.id,
        e.name,
        total_questions.total_questions,
        all_geofences.total_geofences
      HAVING COUNT(DISTINCT em.user_id) > 0
      ORDER BY e.id DESC
      `,
      [teacherId],
    );

    return res.status(200).json({
      success: true,
      results: result.rows,
    });
  } catch (error) {
    console.error("getAllExcursionResults error:", error);
    return res.status(500).json({
      success: false,
      message: "Greška pri dohvaćanju profesorovih ekskurzija.",
    });
  }
};

const getExcursionUsersResults = async (req, res) => {
  try {
    const teacherId = req.query.userId;
    const { excursionId } = req.params;

    const accessCheck = await pool.query(
      `
      SELECT id, name
      FROM excursions
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
      `,
      [excursionId, teacherId],
    );

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ekskurzija nije pronađena ili korisnik nema pristup.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.username,
        e.id AS excursion_id,
        e.name AS excursion_name,
        COALESCE(scores.total_score, 0) AS total_score,
        COALESCE(total_questions.total_questions, 0) AS total_questions,
        COALESCE(solved_geofences.solved_count, 0) AS solved_geofences_count,
        COALESCE(all_geofences.total_geofences, 0) AS total_geofences_count
      FROM excursions e
      JOIN excursion_members em
        ON em.excursion_id = e.id
      JOIN accounts u
        ON u.id = em.user_id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          qa.user_id,
          SUM(qa.score) AS total_score
        FROM geolocations g
        JOIN quiz_attempts qa
          ON qa.geofence_id = g.id
        WHERE EXISTS (
          SELECT 1
          FROM questions q
          WHERE q.geofence_id = g.id
        )
        GROUP BY g.excursion_id, qa.user_id
      ) scores
        ON scores.excursion_id = e.id
        AND scores.user_id = em.user_id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          COUNT(q.id) AS total_questions
        FROM geolocations g
        JOIN questions q
          ON q.geofence_id = g.id
        GROUP BY g.excursion_id
      ) total_questions
        ON total_questions.excursion_id = e.id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          qa.user_id,
          COUNT(DISTINCT qa.geofence_id) AS solved_count
        FROM geolocations g
        JOIN quiz_attempts qa
          ON qa.geofence_id = g.id
        WHERE EXISTS (
          SELECT 1
          FROM questions q
          WHERE q.geofence_id = g.id
        )
        GROUP BY g.excursion_id, qa.user_id
      ) solved_geofences
        ON solved_geofences.excursion_id = e.id
        AND solved_geofences.user_id = em.user_id
      LEFT JOIN (
        SELECT
          g.excursion_id,
          COUNT(*) AS total_geofences
        FROM geolocations g
        WHERE EXISTS (
          SELECT 1
          FROM questions q
          WHERE q.geofence_id = g.id
        )
        GROUP BY g.excursion_id
      ) all_geofences
        ON all_geofences.excursion_id = e.id
      WHERE e.id = $1
        AND e.user_id = $2
        AND em.user_id <> e.user_id
      ORDER BY u.username ASC
      `,
      [excursionId, teacherId],
    );

    return res.status(200).json({
      success: true,
      excursion: accessCheck.rows[0],
      results: result.rows,
    });
  } catch (error) {
    console.error("getExcursionUsersResults error:", error);
    return res.status(500).json({
      success: false,
      message: "Greška pri dohvaćanju rezultata korisnika za ekskurziju.",
    });
  }
};

module.exports = {
  getMyExcursionResults,
  getExcursionResultDetails,
  getAllExcursionResults,
  getExcursionUsersResults,
};
