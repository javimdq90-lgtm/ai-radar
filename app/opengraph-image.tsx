import { SUBLINE, TAGLINE } from "@/components/brand";
import { SHARE_SIZE, shareCard } from "@/lib/share-card";

export const alt = `Context Window: ${TAGLINE}`;
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return shareCard({ tagline: TAGLINE, subline: SUBLINE });
}
