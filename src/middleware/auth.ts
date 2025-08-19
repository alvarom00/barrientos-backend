import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

// payload que firmás en /login: { userId: string }
export interface TokenPayload {
  userId: string;
  iat?: number; // issued-at (lo agrega JWT)
  exp?: number;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Configuración inválida del servidor" });
  }

  try {
    // 1) Verificar token
    const payload = jwt.verify(token, secret) as TokenPayload;

    // 2) Buscar usuario y chequear passwordChangedAt
    const dbUser = await User.findById(payload.userId).select("passwordChangedAt");
    if (!dbUser) {
      return res.status(401).json({ message: "No autorizado" });
    }

    if (dbUser.passwordChangedAt && typeof payload.iat === "number") {
      const changed = Math.floor(new Date(dbUser.passwordChangedAt).getTime() / 1000);
      if (payload.iat < changed) {
        return res.status(401).json({ message: "Sesión inválida. Volvé a iniciar sesión." });
      }
    }

    // 3) Adjuntar usuario al request para usarlo en controladores
    (req as any).user = { userId: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: "Sesión expirada o token inválido" });
  }
}
