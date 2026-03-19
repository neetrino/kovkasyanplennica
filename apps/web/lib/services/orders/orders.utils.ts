import type { MediaItem } from "./orders.types";

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(5, "0");
  return `${year}${month}${day}-${random}`;
}

export function extractImageUrlFromMedia(media: unknown): string | undefined {
  if (!media || !Array.isArray(media) || media.length === 0) return undefined;
  const first = media[0] as MediaItem;
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "url" in first && typeof (first as { url?: string }).url === "string") {
    return (first as { url: string }).url;
  }
  if (first && typeof first === "object" && "src" in first && typeof (first as { src?: string }).src === "string") {
    return (first as { src: string }).src;
  }
  return undefined;
}
