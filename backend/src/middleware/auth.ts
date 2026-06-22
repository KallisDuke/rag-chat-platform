import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
  };
}

// The dashboard is restricted to this account specifically, on top of role.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kallisduke@gmail.com";

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token required",
      });
    }

    const token = authHeader.split(" ")[1] as string;

    if (process.env.JWT_SECRET === undefined) {
      return res.status(500).json({
        message: "JWT_SECRET environment variable is not set",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as unknown as {
      userId: string;
      email: string;
      role?: string;
    };

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "admin" || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
