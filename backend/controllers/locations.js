const userLocations = new Map();
const mainUserId = new Map();

const pool = require("../db");

async function startExcursion(req, res) {
  const { excursionId, userId } = req.body || {};

  if (!excursionId || !userId) {
    return res.status(400).json({ error: "excursionId i userId su obavezni" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE excursions
      SET active = true
      WHERE id = $1 AND user_id = $2
      RETURNING *;
      `,
      [excursionId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error:
          "Ne postoji zapis u tablici active za taj excursion_id i user_id",
      });
    }

    if (!excursionId) throw new Error("excursionId is required");

    if (!userLocations.has(excursionId)) {
      userLocations.set(excursionId, new Map());
    }
    if (!mainUserId.has(excursionId)) {
      mainUserId.set(excursionId, null);
    }

    return res.json({ ok: true, row: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Greška na serveru" });
  }
}

async function endExcursion(req, res) {
  const { excursionId, userId } = req.body || {};

  if (!excursionId || !userId) {
    return res.status(400).json({ error: "excursionId i userId su obavezni" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE excursions
      SET active = false
      WHERE id = $1 AND user_id = $2 
      RETURNING *;
      `,
      [excursionId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error:
          "Ne postoji zapis u tablici active za taj excursion_id i user_id",
      });
    }

    await pool.query(
      `
      UPDATE excursion_members
      SET status = 'ended'
      WHERE excursion_id = $1
        AND status <> 'ended';
      `,
      [excursionId],
    );

    userLocations.delete(excursionId);
    mainUserId.delete(excursionId);

    const io = req.app.get("io");
    const roomName = req.app.get("roomName");

    io.to(roomName(excursionId)).emit("excursionEnded", { excursionId });

    return res.json({ ok: true, row: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Greška na serveru" });
  }
}

async function leaveExcursion(req, res) {
  const { excursionId, userId } = req.body || {};

  if (!excursionId || !userId) {
    return res.status(400).json({ error: "excursionId i userId su obavezni" });
  }

  try {
    const excursionMap = userLocations.get(excursionId);
    excursionMap.delete(userId);

    const result = await pool.query(
      `
      UPDATE excursion_members
      SET status = 'inactive'
      WHERE excursion_id = $1 AND user_id = $2
      RETURNING *;
      `,
      [excursionId, userId],
    );

    if (result.rowCount === 0) {
      return res.json({
        ok: true,
        message: "Napustio (nije postojao membership zapis).",
      });
    }

    return res.json({ ok: true, message: "Napustio", member: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Greška na serveru" });
  }
}

function getUserList() {
  return Array.from(userLocations.values()).map((u) => ({
    userId: u.userId,
    position: u.position,
    isMain: u.userId === mainUserId,
    updatedAt: u.updatedAt,
  }));
}

function getAllLocations(req, res) {
  const { excursionId } = req.body || {};

  if (!excursionId) {
    return res.status(400).json({ error: "excursionId is required" });
  }

  if (!userLocations.has(excursionId)) {
    return res.json([]);
  }

  const excursionMap = userLocations.get(excursionId);
  const mainUser = mainUserId.get(excursionId);

  const data = Array.from(excursionMap.values()).map((item) => ({
    ...item,
    isMain: item.userId === mainUser,
  }));

  return res.json(data);
}

function saveUserLocation(req, res) {
  const { excursionId, userId, position } = req.body || {};

  if (!excursionId || !userId || !position) {
    return res.status(400).json({
      error: "excursionId, userId i position su obavezni",
    });
  }

  if (!userLocations.has(excursionId)) {
    userLocations.set(excursionId, new Map());
  }

  const excursionMap = userLocations.get(excursionId);

  excursionMap.set(userId, {
    userId,
    position,
    updatedAt: Date.now(),
  });

  return res.json({ ok: true });
}

function setMainUser(req, res) {
  const { excursionId, userId } = req.body || {};
  if (!userId || !excursionId)
    return res
      .status(400)
      .json({ error: "userId and excursionId is required" });

  mainUserId.set(excursionId, userId);

  return res.json({ ok: true, userId });
}

function getMainUserId() {
  return mainUserId;
}

module.exports = {
  getUserList,
  getAllLocations,
  saveUserLocation,
  setMainUser,
  getMainUserId,
  startExcursion,
  endExcursion,
  leaveExcursion,
};
