import type { Category } from "./types";

const TOKEN: Record<Category, string> = {
  models: "models",
  research: "research",
  products: "products",
  "open-source": "open-source",
  policy: "policy",
  business: "business",
  tools: "dev-tools",
};

/** A topic's colour for the current surface (bright on black, darker on bone; see globals.css). */
export const catColor = (category: Category) => `var(--cat-${TOKEN[category]})`;

/** The bright topic colours (for black) as literal hex, where CSS variables don't work, e.g. share images. */
export const CATEGORY_HEX: Record<Category, string> = {
  models: "#7AA7FF",
  research: "#B49CFF",
  products: "#5FD3B5",
  "open-source": "#9BD86A",
  policy: "#FF8A6B",
  business: "#F2C14E",
  tools: "#6FD0E8",
};

/** The darker topic colours used on bone (see .bone in globals.css), as hex for the email. */
export const CATEGORY_HEX_ON_BONE: Record<Category, string> = {
  models: "#2F5FCC",
  research: "#6A4BD1",
  products: "#127A61",
  "open-source": "#3E7A1F",
  policy: "#B13F22",
  business: "#855D00",
  tools: "#0B6E86",
};
