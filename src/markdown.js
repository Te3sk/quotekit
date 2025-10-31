import MarkdownIt from "markdown-it";
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

export function mdToHtml(src) {
    return md.render(src || "");
}
