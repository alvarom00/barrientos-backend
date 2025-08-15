export function normalizeVideoUrls(input: unknown): string[] {
  const arr: string[] =
    Array.isArray(input) ? (input as string[]) :
    typeof input === "string" ? input.split(",") :
    [];

  return arr
    .map(s => s.trim())
    .filter(Boolean)
    .filter(isLikelyVideoUrl);
}

function isLikelyVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) return true;
    if (host.includes("vimeo.com")) return true;

    if (u.pathname.toLowerCase().endsWith(".mp4")) return true;

    return false;
  } catch {
    return false;
  }
}
