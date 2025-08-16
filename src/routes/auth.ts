import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { requireAuth } from "../middleware/auth";
import { sendEmail } from "../utils/sendEmail";
import crypto from "crypto";

const router = Router();
const frontend = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// REGISTRO (usar solo para crear el admin una vez, luego borrar o proteger)
router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Faltan datos" });

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Usuario ya existe" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ email, passwordHash });
  await user.save();
  res.json({ message: "Usuario creado correctamente" });
});

// LOGIN
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: "Email o contraseña incorrectos" });

  // JWT simple, ajústalo como quieras
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  res.json({ token });
});

// CAMBIAR CONTRASEÑA (restringido a usuario logueado)
router.post("/change-password", requireAuth, async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  const valid = await user.comparePassword(currentPassword);
  if (!valid) return res.status(401).json({ message: "Contraseña actual incorrecta" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Contraseña cambiada correctamente" });
});

router.post("/forgot-password", async (req, res) => {
    console.log("Recibí solicitud de reset password")
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // No revelar si existe o no el usuario
    return res.json({ message: "Si el mail existe, se envió un enlace para recuperar la contraseña." });
  }

  // Generar token seguro (y almacenar en DB con expiración)
  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60;
  await user.save();

  const resetUrl = `${frontend}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Recuperar contraseña",
    html: `
      <p>Hola, has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <p>Si no fuiste tú, ignora este correo.</p>
    `,
  });

  res.json({ message: "Si el mail existe, se envió un enlace para recuperar la contraseña." });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    return res.status(400).json({ message: "Token inválido o expirado" });
  }
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: "Contraseña actualizada correctamente" });
});



export default router;
