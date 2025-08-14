import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  email?: string;
  // agregá acá lo que firmes dentro del token
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Falla temprano si no hay secreto
    return res.status(500).json({ message: "Configuración inválida del servidor" });
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    // guardamos el usuario en la request para usar en controladores
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Sesión expirada o token inválido" });
  }
}