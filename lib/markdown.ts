import "server-only";
import { Marked } from "marked";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Our own Markdown (guide steps and answers) to HTML. It's written by us and checked in review,
 * not user input; any raw HTML in it is shown as text rather than rendered.
 */
const md = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

export const renderMarkdown = (source: string) => md.parse(source, { async: false });
