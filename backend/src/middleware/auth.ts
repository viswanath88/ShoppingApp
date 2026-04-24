import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided. Authorization header is required." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid token format. Use: Bearer <token>" });
  }

  try {
    const decoded = verifyToken(parts[1]);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function authorizeAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  next();
}
