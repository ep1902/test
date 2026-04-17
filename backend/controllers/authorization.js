const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const TOKEN_EXPIRES_IN = "1h";

function signToken(username, roleId) {
  return jwt.sign({ roleId }, JWT_SECRET, {
    subject: username,
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

function jwtRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token)
    return res.status(401).json({ success: false, data: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { username: decoded.sub, roleId: decoded.roleId };
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, data: "Invalid or expired token" });
  }
}

async function getUserInfo(req, res) {
  try {
    const p = req.user;

    if (!p?.username) {
      return res
        .status(401)
        .json({ error: "Nema user info (provjeri jwtRequired middleware)." });
    }

    const { rows } = await pool.query(
      `SELECT id, role_id, username, email, first_name, last_name
       FROM accounts
       WHERE username = $1
       LIMIT 1`,
      [p.username],
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    const r = rows[0];

    return res.json({
      id: r.id,
      username: r.username,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      role: r.role_id,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Greška na serveru." });
  }
}

async function register(req, res) {
  try {
    const data = req.body;
    const passwordHash = await bcrypt.hash(data.password, 10);

    await pool.query(
      `INSERT INTO accounts (username, password_hash, email, first_name, last_name, role_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.username,
        passwordHash,
        data.email,
        data.firstName,
        data.lastName,
        data.roleId,
      ],
    );

    return res.json({ success: true, data: "Registration successful." });
  } catch (e) {
    if (e.code === "23505") {
      return res
        .status(409)
        .json({ success: false, data: "Username or email already exists." });
    }
    console.error(e);
    return res.status(500).json({ success: false, data: "Server error." });
  }
}

async function login(req, res) {
  try {
    const data = req.body;
    if (!data?.username || !data?.password) {
      return res
        .status(400)
        .json({ success: false, data: "Missing a field in login package." });
    }

    const { rows } = await pool.query(
      `SELECT role_id, username, password_hash, email, first_name, last_name
       FROM accounts
       WHERE username = $1
       LIMIT 1`,
      [data.username],
    );

    if (rows.length === 0)
      return res
        .status(401)
        .json({ success: false, data: "Wrong credentials." });

    const userRow = rows[0];
    const ok = await bcrypt.compare(data.password, userRow.password_hash);

    if (!ok)
      return res
        .status(401)
        .json({ success: false, data: "Wrong credentials." });

    const access_token = signToken(userRow.username, userRow.role_id);

    const user = {
      roleId: userRow.role_id,
      username: userRow.username,
      email: userRow.email,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
    };

    return res.json({ success: true, data: { user, access_token } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, data: "Server error." });
  }
}

async function updateProfile(req, res) {
  try {
    const data = req.body;
    const currentId = data.userId;

    const { rows: existingRows } = await pool.query(
      `SELECT role_id, username FROM accounts WHERE id = $1 LIMIT 1`,
      [currentId],
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    const roleId = existingRows[0].role_id;
    const changedUsername = existingRows[0].username !== data.username;

    await pool.query(
      `UPDATE accounts
       SET username = $1, email = $2, first_name = $3, last_name = $4
       WHERE id = $5`,
      [data.username, data.email, data.firstName, data.lastName, currentId],
    );

    const { rows: userRows } = await pool.query(
      `SELECT id, email, username, first_name, last_name, role_id
       FROM accounts
       WHERE id = $1
       LIMIT 1`,
      [currentId],
    );

    const updatedUserRow = userRows[0];

    const user = {
      id: updatedUserRow.id,
      email: updatedUserRow.email,
      username: updatedUserRow.username,
      firstName: updatedUserRow.first_name,
      lastName: updatedUserRow.last_name,
      roleId: updatedUserRow.role_id,
    };

    const access_token = changedUsername
      ? signToken(user.username, roleId)
      : null;

    return res.status(200).json({
      success: true,
      data: { user, access_token },
    });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Username or email already exists.",
      });
    }
    console.error(e);
    return res.status(500).json({ success: false, error: "Database error" });
  }
}

async function deleteProfile(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Neispravan ID." });
    }

    const result = await pool.query(
      `DELETE FROM accounts
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
  register,
  login,
  updateProfile,
  jwtRequired,
  getUserInfo,
  deleteProfile,
};
