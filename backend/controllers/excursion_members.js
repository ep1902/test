const pool = require("../db");

async function getUsersActivity(req, res) {
  const { excursionId } = req.body || {};

  if (!excursionId) {
    return res.status(400).json({ error: "excursionId is required" });
  }

  try {
    const r = await pool.query(
      `
      SELECT
        a.id,
        a.username,
        a.email,
        a.first_name,
        a.last_name,
        a.role_id,
        em.status
      FROM excursion_members em
      JOIN accounts a ON a.id = em.user_id
      WHERE em.excursion_id = $1
      ORDER BY em.status DESC, a.last_name ASC, a.first_name ASC;
      `,
      [excursionId],
    );

    const active = [];
    const inactive = [];

    for (const row of r.rows) {
      const user = {
        id: row.id,
        username: row.username,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role_id: row.role_id,
      };

      if (row.status === "active") active.push(user);
      else if (row.status === "inactive") inactive.push(user);
    }

    return res.json({ ok: true, excursionId, active, inactive });
  } catch (err) {
    console.error("getExcursionUsersByActivity error:", err);
    return res.status(500).json({ error: "Greška na serveru" });
  }
}

module.exports = {
  getUsersActivity,
};
