import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { HttpError, requireAuth, signToken } from "../auth.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

// POST /auth/signup  { name, email, password }
router.post("/signup", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (name.length < 2) throw new HttpError(400, "Please enter your name.");
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please enter a valid email address.");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");

  const existing = await query("select id from users where email = $1", [email]);
  if (existing.rows.length) throw new HttpError(409, "An account with this email already exists.");

  // Never store the real password, only a slow one-way hash of it.
  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    "insert into users (name, email, password_hash) values ($1, $2, $3) returning id, name, email",
    [name, email, passwordHash]
  );

  const user = cleanUser(rows[0]);
  res.status(201).json({ token: signToken(user), user });
});

// POST /auth/login  { email, password }
router.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  const { rows } = await query("select * from users where email = $1", [email]);
  const row = rows[0];
  // Same message for "no such email" and "wrong password", so attackers can't
  // find out which emails have accounts.
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(401, "Email or password is incorrect.");
  }

  const user = cleanUser(row);
  res.json({ token: signToken(user), user });
});

// GET /auth/me  -> who am I? (used when the app reloads)
router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await query("select id, name, email from users where id = $1", [req.user.id]);
  if (!rows.length) throw new HttpError(401, "Account not found. Please log in again.");
  res.json({ user: cleanUser(rows[0]) });
});

export default router;
