import { SUBLINE, TAGLINE } from "@/components/brand";
import { SHARE_SIZE, shareCard } from "@/lib/share-card";
import { localImage, SHARE_HERO } from "@/lib/share-image";

export const alt = `Context Window: ${TAGLINE}`;
export const size = SHARE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return shareCard({ tagline: TAGLINE, subline: SUBLINE, image: SHARE_HERO && localImage(SHARE_HERO) });
}
