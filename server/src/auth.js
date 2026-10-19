import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) {
  throw new Error("JWT_SECRET is missing or too short (use at least 16 characters).");
}

// Thrown anywhere in a route to send a clean error response.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name, email: user.email }, SECRET, {
    expiresIn: "7d",
  });
}

function readUser(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    return { id: payload.sub, name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}

// Route needs a logged-in user -> 401 if not.
export function requireAuth(req, res, next) {
  const user = readUser(req);
  if (!user) return res.status(401).json({ error: "Please log in first." });
  req.user = user;
  next();
}

// Route works for everyone, but knows who you are if you're logged in.
export function optionalAuth(req, res, next) {
  req.user = readUser(req);
  next();
}
