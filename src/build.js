import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";
import yaml from "js-yaml";
import { mdToHtml } from "./markdown.js";
import { eur, formatDate, computeTotals } from "./helpers/misc.js";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TPL_DIR = path.join(__dirname, "..", "templates");
const OUT_DIR = path.join(__dirname, "..", "out");

function readYaml(p) {
  const raw = fs.readFileSync(p, "utf8");
  return yaml.load(raw);
}

function loadPartials() {
  const partialsDir = path.join(TPL_DIR, "partials");
  fs.readdirSync(partialsDir).forEach((f) => {
    const name = path.basename(f, ".hbs");
    const src = fs.readFileSync(path.join(partialsDir, f), "utf8");
    Handlebars.registerPartial(name, src);
  });
}

function registerHelpers() {
  Handlebars.registerHelper("eur", eur);
  Handlebars.registerHelper("formatDate", formatDate);
}

async function build(dataPath, { onlyHtml = false } = {}) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const absData = path.resolve(dataPath);
  const data = readYaml(absData);

  const scopeSrc = data.scope_md_path
    ? fs.readFileSync(path.resolve(path.dirname(absData), data.scope_md_path), "utf8")
    : data.scope_md || "";
  const termsSrc = data.terms_md_path
    ? fs.readFileSync(path.resolve(path.dirname(absData), data.terms_md_path), "utf8")
    : data.terms_md || "";

  const scope_html = scopeSrc ? mdToHtml(scopeSrc) : "";
  const terms_html = termsSrc ? mdToHtml(termsSrc) : "";

  const itemsWithTotal = (data.items || []).map((it) => ({
    ...it,
    total: (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
  }));
  const totals = computeTotals(itemsWithTotal, data.pricing || {});

  loadPartials();
  registerHelpers();
  const layoutSrc = fs.readFileSync(path.join(TPL_DIR, "layout.hbs"), "utf8");
  const template = Handlebars.compile(layoutSrc, { noEscape: true });

  const ctx = { ...data, items: itemsWithTotal, totals, scope_html, terms_html };
  const html = template(ctx);

  const ref = data.meta?.ref?.replace(/[^\w\-]/g, "_") || "preventivo";
  const base = `${ref}-${(data.client?.name || "cliente").replace(/\s+/g, "_")}`;
  const htmlPath = path.join(OUT_DIR, `${base}.html`);
  const pdfPath = path.join(OUT_DIR, `${base}.pdf`);

  fs.writeFileSync(htmlPath, html, "utf8");

  if (onlyHtml) {
    console.log(`HTML pronto: ${htmlPath}`);
    return;
  }

  const browser = await puppeteer.launch({
    args: ["--font-render-hinting=none"]
  });
  const page = await browser.newPage();
  await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", right: "12mm", bottom: "18mm", left: "12mm" }
  });
  await browser.close();

  console.log(`PDF pronto: ${pdfPath}`);
}

(async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Uso: npm run build -- data/proposals/<file>.yaml [--html]");
    process.exit(1);
  }
  const onlyHtml = args.includes("--html");
  const dataPath = args.find((a) => a.endsWith(".yaml") || a.endsWith(".yml"));
  await build(dataPath, { onlyHtml });
})();
