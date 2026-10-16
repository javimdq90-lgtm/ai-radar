import type { CSSProperties } from "react";
import type { Category } from "./types";

/** Category key -> token suffix in globals.css (the tokens say "dev-tools" where the data says "tools"). */
const TOKEN: Record<Category, string> = {
  models: "models",
  research: "research",
  products: "products",
  "open-source": "open-source",
  policy: "policy",
  business: "business",
  tools: "dev-tools",
};

/**
 * Sets --cat, --tint and --tint-border on an element, so it and its children can use
 * text-cat, bg-tint, border-tint-line and the .dot class in that category's colour.
 */
export const catStyle = (category: Category) =>
  ({
    "--cat": `var(--cw-cat-${TOKEN[category]})`,
    "--tint": `var(--cw-tint-${TOKEN[category]})`,
    "--tint-border": `var(--cw-tint-${TOKEN[category]}-border)`,
  }) as CSSProperties;

/** The same colours as literal hex, for email HTML where CSS variables don't work. */
export const CATEGORY_HEX: Record<Category, string> = {
  models: "#7AA7FF",
  research: "#B49CFF",
  products: "#5FD3B5",
  "open-source": "#9BD86A",
  policy: "#FF8A6B",
  business: "#F2C14E",
  tools: "#6FD0E8",
};
