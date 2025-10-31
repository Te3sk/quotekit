# 🧾 QuoteKit — Markdown-Driven Quotation Generator

**QuoteKit** is a lightweight, developer-friendly quotation generator built with **Node.js**, **Handlebars**, **YAML**, and **Puppeteer**.  
It converts structured data files (written in YAML or Markdown) into **beautifully formatted PDF quotes** — without ever opening Word or Google Docs.

---

## 📖 Overview

This tool is designed for **freelancers and professionals** who regularly prepare project quotations or estimates and want:
- Clean, branded, and printable PDFs  
- Fully versionable documents stored as text files  
- Zero manual formatting effort  
- Quick automation via CLI or scripts  

A quote is generated from:
1. A **YAML data file** containing the project information, client data, and line items.  
2. A **Handlebars HTML template** that defines the structure and layout.  
3. An optional **Markdown block** for detailed descriptions or terms.  

The result: a polished **HTML + PDF output** ready to send to the client.

---

## 🧱 Project Structure

```text
quotekit/
├─ package.json
├─ README.md
├─ src/
│ ├─ build.js
│ ├─ markdown.js
│ └─ helpers/
│ └─ misc.js
├─ templates/
│ ├─ layout.hbs
│ └─ partials/
│ ├─ lineItem.hbs
│ └─ footer.hbs
├─ assets/
│ ├─ styles.css
│ └─ logo.png (optional)
├─ data/
│ ├─ proposals/
│ │ ├─ 2025-11-01-giovanni.yaml
│ │ └─ ...
│ └─ markdown/
│ └─ giovanni-descrizione.md
└─ out/
├─ 2025-11-01_Studio_Tattoo_Caruso.html
└─ 2025-11-01_Studio_Tattoo_Caruso.pdf
```


---

## ⚙️ Requirements

- **Node.js ≥ 18**
- **npm ≥ 9**
- **Chromium / Puppeteer** (automatically installed)
- macOS, Linux, or Windows environment with CLI access

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quotekit.git
cd quotekit

# Install dependencies
npm install
```

---

## 🧩 Usage
### 1. Create a new proposal file

Inside data/proposals/, create a YAML file such as:

```yaml
meta:
  date: 2025-11-01
  valid_until: 2025-11-15
  ref: DO-PRV-2025-103

company:
  name: Niccolò Fulgaro
  vat: IT01234567890
  email: quotes@fulgaro.dev
  phone: "+39 379 320 8283"
  address: Via Example 1, 00100 Rome (RM)
  site: fulgaro.dev
  regime: Regime forfettario — IVA non applicabile

client:
  name: Giovanni Caruso
  company: Studio Tattoo Caruso
  email: hello@carusogiovanni.com
  phone: "+39 333 111 2222"

scope_md: |
  **Objective:** Development of a WhatsApp chatbot for tattoo studio lead management.
  - Automatic client reply
  - Appointment booking via CRM
  - Internal notifications

items:
  - title: Chatbot setup
    qty: 1
    unit_price: 300
  - title: CRM integration
    qty: 1
    unit_price: 150
  - title: Flow refinement
    qty: 1
    unit_price: 200

pricing:
  discount: 0
  vat_rate: 0   # For forfettario regime (no VAT)

terms_md: |
  **Payment:** 50% at start, 50% at delivery.
  **Validity:** 15 days from issue date.
  **Extra:** Out-of-scope work will be quoted separately.
```

---

### 2. Generate the quote

```bash
npm run build -- data/proposals/2025-11-01-giovanni.yaml
```

This will produce both:
- out/2025-11-01_Studio_Tattoo_Caruso.html
- out/2025-11-01_Studio_Tattoo_Caruso.pdf

To generate only the HTML (for visual inspection):

```bash
npm run preview -- data/proposals/2025-11-01-giovanni.yaml --html
```

---

### 3. Filename convention

The generated files follow the format:
```text
YYYY-MM-DD_Company-Name.pdf
```

If the company name is missing, the client’s name is used;
if both are missing, the file is named:

```text
YYYY-MM-DD_unknown_customer.pdf
```

---

## 🧠 How It Works

1. YAML Parsing — build.js reads the selected .yaml file with js-yaml.
2. Markdown Conversion — optional text sections are rendered to HTML via markdown-it.
3. Handlebars Rendering — data is injected into layout.hbs and its partials (lineItem.hbs, footer.hbs).
4. Styling — a clean black-and-white layout defined in assets/styles.css.
5. PDF Generation — Puppeteer renders the compiled HTML into a print-ready A4 PDF.

Everything runs locally, with no external dependencies or internet access required.

---

## 🧰 Customization Guide
### 🖋 Templates

- Modify templates/layout.hbs to change the document structure (headers, sections, etc.).
- Edit templates/partials/lineItem.hbs to alter how individual line items are displayed.
- Update templates/partials/footer.hbs for footer info or legal text.

### 🎨 Styles

- The look and feel is defined entirely in assets/styles.css.
- You can easily change:
    - Font size, weight, and color
    - Spacing between sections
    - Borders and alignment

### 💼 Company Defaults

To define reusable defaults (e.g., your own data pre-filled in each new quote), you can create a base YAML like data/template-default.yaml and duplicate it when preparing new ones.

```bash
cp data/template-default.yaml data/proposals/$(date +%F)-client.yaml
```

### 🧾 Output Location

By default, all files are saved inside /out/.
You can modify this path in src/build.js:

```bash
const OUT_DIR = path.join(__dirname, "..", "out");
```

### 📂 Optional Year-Based Foldering

To organize quotes by year, change the script to:

```js
const year = formattedDate.split("-")[0];
const OUT_DIR = path.join(__dirname, "..", "out", year);
```

---

## 🔄 File Naming & Versioning

Because all data is text-based:
- Every quote can be tracked with Git (diffs, commits, tags).
- You can easily reuse YAML structures for recurring clients.
- It’s trivial to automate batch generation with cron, Make, or CI tools.

---

## 🧾 Example Output (Conceptually)

```vbnet
Preventivo
Ref: DO-PRV-2025-103
Date: 01/11/2025
Valid until: 15/11/2025

Client: Studio Tattoo Caruso  
Contact: hello@carusogiovanni.com · +39 333 111 2222

------------------------------------------------------

Objective: WhatsApp chatbot development for tattoo studio

Item                         Qty    Unit    Price
------------------------------------------------------
Chatbot setup                1      €300    €300
CRM integration              1      €150    €150
Flow refinement              1      €200    €200

TOTAL: €793,00
------------------------------------------------------

Payment: 50% at start, 50% at delivery  
Validity: 15 days from issue date  
Extra: Out-of-scope work will be quoted separately
```

---

## 🧑‍💻 Development Notes
### Helper functions

Located in src/helpers/misc.js:
- `eur(value)` → formats numbers as EUR currency (€1.234,00)
- `formatDate(date)` → formats ISO or JS date objects (DD/MM/YYYY)
- `computeTotals(items, pricing)` → calculates subtotal, discount, VAT, and total

### Markdown Rendering

Defined in src/markdown.js using markdown-it.
You can safely embed Markdown inside your YAML under keys like scope_md or terms_md.

---

## 🧾 Legal Note (For Italian Freelancers)

When using this template under Italian “regime forfettario”, remember:

- No VAT is applied (art. 1, commi 54-89, L. 190/2014).
- No withholding tax (ritenuta d’acconto) applies.
- Optionally include this note in your footer or conditions section:

> “Operazione in franchigia da IVA — Regime forfettario (L. 190/2014).
> Non soggetto a ritenuta d’acconto ai sensi dell’art. 1, comma 67.”

---

## 📜 License

This project is released under the MIT License.
You are free to use, modify, and distribute it for personal or commercial purposes.