import { Router, Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const form = req.body;

  try {
    const queres = form.queres === "Ambas" ? "Vender y Arrendar" : form.queres;

    const html = `
      <h2>Nuevo formulario recibido desde Publicar</h2>
      <ul>
        <li><b>Nombre y Apellido:</b> ${form.nombre}</li>
        <li><b>Email:</b> ${form.email}</li>
        <li><b>Es:</b> ${form.eres}</li>
        <li><b>Quiere:</b> ${queres}</li>
        <li><b>Ubicación del campo:</b> ${form.ubicacion}</li>
        <li><b>Superficie total:</b> ${form.superficie}</li>
        <li><b>Tipo de campo:</b> ${form.tipoCampo}</li>
        <li><b>Precio estimado por hectárea:</b> ${form.precio}</li>
        <li><b>Características para destacar:</b> ${form.caracteristicas}</li>
        <li><b>¿Tiene escritura?:</b> ${form.documentacion}</li>
        <li><b>Teléfono/WhatsApp:</b> ${form.telefono}</li>
        <li><b>Comentarios:</b> ${form.comentarios}</li>
      </ul>
    `;

    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "Nuevo formulario de publicación de campo",
      html,
    });

    res.json({ ok: true, message: "Formulario enviado correctamente" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al enviar el formulario" });
  }
});

export default router;
