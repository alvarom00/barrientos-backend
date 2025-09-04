import { Router, Request, Response } from "express";
import Property from "../models/Property";
import { Types } from "mongoose";

const router = Router();

type SitemapUrl = {
  loc: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
};

type LeanPropIdDates = {
  _id: Types.ObjectId | string;
  updatedAt?: Date;
  createdAt?: Date;
};

function baseUrl() {
  return (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
}

function fmtDate(d: Date | string | number) {
  try {
    const iso = new Date(d).toISOString();
    return iso.split("T")[0];
  } catch {
    return undefined;
  }
}

router.get("/robots.txt", async (_req: Request, res: Response) => {
  const site = baseUrl();
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /admin/login",
    "Disallow: /admin/dashboard",
    "",
    `Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600");
  res.send(lines);
});

router.get("/sitemap.xml", async (_req: Request, res: Response) => {
  const site = baseUrl();

  const staticUrls: SitemapUrl[] = [
    { loc: `${site}/`, changefreq: "weekly", priority: "0.9" },
    { loc: `${site}/campos`, changefreq: "weekly", priority: "0.8" },
    { loc: `${site}/comprar`, changefreq: "weekly", priority: "0.8" },
    { loc: `${site}/alquilar`, changefreq: "weekly", priority: "0.8" },
    { loc: `${site}/nosotros`, changefreq: "monthly", priority: "0.6" },
    { loc: `${site}/publicar`, changefreq: "monthly", priority: "0.6" },
  ];

  // ⬇️ Tipamos el resultado de lean()
  const props = (await Property.find({})
    .select("_id slug updatedAt createdAt")
    .sort({ updatedAt: -1 })
    .lean()) as Array<{
    _id: any;
    slug?: string;
    updatedAt?: Date;
    createdAt?: Date;
  }>;

  const propUrls = props.map((p) => {
    const last = p.updatedAt || p.createdAt;
    const id = typeof p._id === "object" ? String(p._id) : (p._id as string);
    const slug = p.slug ? `/${p.slug}` : "";
    return {
      loc: `${site}/properties/${id}${slug}`,
      lastmod: last ? fmtDate(last) : undefined,
      changefreq: "weekly",
      priority: "0.7",
    };
  });

  const all: SitemapUrl[] = [...staticUrls, ...propUrls];

  const urlset = all
    .map((u) => {
      const last = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "";
      const cf = u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : "";
      const pr = u.priority ? `<priority>${u.priority}</priority>` : "";
      return `<url><loc>${u.loc}</loc>${last}${cf}${pr}</url>`;
    })
    .join("");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urlset +
    `</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600");
  res.send(xml);
});

export default router;
