import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { requireAuth } from "../middleware/auth";
import { sendEmail } from "../utils/sendEmail";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

const router = Router();

// ✅ SIEMPRE desde env; no derives desde el request
const FRONTEND_BASE = (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(/\/$/, "");

// --- Rate limits básicos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos, probá más tarde." },
});

// LOGIN
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "Faltan datos" });

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Email o contraseña incorrectos" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  res.json({ token });
});

// CAMBIAR CONTRASEÑA (logueado)
router.post("/change-password", requireAuth, async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  const valid = await user.comparePassword(currentPassword);
  if (!valid) return res.status(401).json({ message: "Contraseña actual incorrecta" });

  user.passwordHash = await bcrypt.hash(newPassword, 12); // un poco más fuerte
  // opcional: invalida JWTs antiguos
  (user as any).passwordChangedAt = new Date();
  await user.save();

  res.json({ message: "Contraseña cambiada correctamente" });
});

// OLVIDÉ MI CONTRASEÑA (rate limited)
router.post("/forgot-password", forgotLimiter, async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) {
    return res.json({ message: "Si el mail existe, se envió un enlace para recuperar la contraseña." });
  }

  const user = await User.findOne({ email });
  // Nunca reveles si existe o no
  if (!user) {
    return res.json({ message: "Si el mail existe, se envió un enlace para recuperar la contraseña." });
  }

  // token crudo para el mail + hash para DB
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  (user as any).resetPasswordToken = tokenHash;
  (user as any).resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);
  await user.save();

  const resetUrl = `${FRONTEND_BASE}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Recuperar contraseña",
    html: `
      <p>Hola, has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a></p>
      <p>Si no fuiste tú, ignora este correo.</p>
    `,
  });

  res.json({ message: "Si el mail existe, se envió un enlace para recuperar la contraseña." });
});

// RESET PASSWORD (usa el hash)
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body ?? {};
  if (!token || !password || String(password).length < 8) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Token inválido o expirado" });
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  (user as any).resetPasswordToken = undefined;
  (user as any).resetPasswordExpires = undefined;
  (user as any).passwordChangedAt = new Date(); // invalida JWTs viejos si tu middleware lo verifica
  await user.save();

  res.json({ message: "Contraseña actualizada correctamente" });
});

export default router;
