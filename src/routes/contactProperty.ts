import { Router, Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { nombre, email, telefono, mensaje, ref, titulo, url } = req.body;

  const html = `
    <h2>Nueva consulta de campo</h2>
    <ul>
      <p><b>Propiedad:</b> ${titulo || "(sin título)"} (${ref || ""})</p>
      <li><b>Nombre:</b> ${nombre}</li>
      <li><b>Email:</b> ${email}</li>
      <li><b>Teléfono:</b> ${telefono}</li>
      <li><b>Mensaje:</b> ${mensaje}</li>
    </ul>
  `;

  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "Nueva consulta de un interesado",
      html,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al enviar el mail" });
  }
});

export default router;
