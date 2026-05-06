import axios from "axios";
import { Request, Response, NextFunction } from "express";

export const verifyTurnstile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.body.captchaToken;

    if (!token) {
      return res.status(400).json({
        message: "Captcha requerido",
      });
    }

    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.data.success) {
      return res.status(403).json({
        message: "Captcha inválido",
      });
    }

    next();
  } catch (error) {
    console.error("Turnstile error:", error);

    return res.status(500).json({
      message: "Error verificando captcha",
    });
  }
};