// Import dependencies and helpers
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";
import yaml from "js-yaml";
import { mdToHtml } from "./markdown.js";
import { eur, formatDate, computeTotals } from "./helpers/misc.js";
import puppeteer from "puppeteer";

// Setup working directories and template/output paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TPL_DIR = path.join(__dirname, "..", "templates");
const OUT_DIR = path.join(__dirname, "..", "out");

// Helper to read and parse a YAML file
function readYaml(p) {
  const raw = fs.readFileSync(p, "utf8");
  return yaml.load(raw);
}

// Register Handlebars partials from the partials directory
function loadPartials() {
  const partialsDir = path.join(TPL_DIR, "partials");
  fs.readdirSync(partialsDir).forEach((f) => {
    const name = path.basename(f, ".hbs");
    const src = fs.readFileSync(path.join(partialsDir, f), "utf8");
    Handlebars.registerPartial(name, src);
  });
}

// Register custom Handlebars helpers (currency, date formatting)
function registerHelpers() {
  Handlebars.registerHelper("eur", eur);
  Handlebars.registerHelper("formatDate", formatDate);
}

// Main build function to generate HTML and PDF
async function build(dataPath, { onlyHtml = false } = {}) {
  // Create output directory if it does not exist
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // Absolute path to input YAML with proposal data
  const absData = path.resolve(dataPath);
  const data = readYaml(absData);

  // Load and process Markdown for scope and terms (inline or file)
  const scopeSrc = data.scope_md_path
    ? fs.readFileSync(path.resolve(path.dirname(absData), data.scope_md_path), "utf8")
    : data.scope_md || "";
  const termsSrc = data.terms_md_path
    ? fs.readFileSync(path.resolve(path.dirname(absData), data.terms_md_path), "utf8")
    : data.terms_md || "";

  // Convert loaded Markdown to HTML
  const scope_html = scopeSrc ? mdToHtml(scopeSrc) : "";
  const terms_html = termsSrc ? mdToHtml(termsSrc) : "";

  // Compute item totals and aggregate proposal totals
  const itemsWithTotal = (data.items || []).map((it) => ({
    ...it,
    total: (Number(it.qty) || 0) * (Number(it.unit_price) || 0),
  }));
  const totals = computeTotals(itemsWithTotal, data.pricing || {});

  // Prepare Handlebars: partials and helpers registration
  loadPartials();
  registerHelpers();
  const layoutSrc = fs.readFileSync(path.join(TPL_DIR, "layout.hbs"), "utf8");
  const template = Handlebars.compile(layoutSrc, { noEscape: true });

  // Assemble complete template context
  const ctx = { ...data, items: itemsWithTotal, totals, scope_html, terms_html };
  const html = template(ctx);

  // Build output file base name (ref + client name)

  // Parse and format date
  const date = data.meta?.date ? new Date(data.meta.date) : new Date();
  const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

  // Determine client/company name with fallback
  let entityName = data.client?.company?.trim() || data.client?.name?.trim() || "unknown_customer";
  entityName = entityName.replace(/[^\w\-]+/g, "_"); // sanitize (remove spaces/symbols)

  // Build base name
  const base = `${formattedDate}_${entityName}`;

  // Define output paths
  const htmlPath = path.join(OUT_DIR, `${base}.html`);
  const pdfPath = path.join(OUT_DIR, `${base}.pdf`);

  // Write generated HTML file
  fs.writeFileSync(htmlPath, html, "utf8");

  // If only HTML export is requested, return early
  if (onlyHtml) {
    console.log(`HTML pronto: ${htmlPath}`);
    return;
  }

  // Use Puppeteer to render the HTML file to PDF
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

  // Notify that the PDF is done
  console.log(`PDF pronto: ${pdfPath}`);
}

// Entry point: parse CLI arguments and run build
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
