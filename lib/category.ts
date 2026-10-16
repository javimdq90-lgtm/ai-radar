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

/** Category colours as literal hex, for email HTML and share images, where CSS variables don't work. */
export const CATEGORY_HEX: Record<Category, string> = {
  models: "#7AA7FF",
  research: "#B49CFF",
  products: "#5FD3B5",
  "open-source": "#9BD86A",
  policy: "#FF8A6B",
  business: "#F2C14E",
  tools: "#6FD0E8",
};
