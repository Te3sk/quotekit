export function eur(value) {
    const n = Number(value || 0);
    return n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function computeTotals(items, pricing) {
    const subtotal = items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const discount = Number(pricing.discount || 0);
    const vatRate = Number(pricing.vat_rate || 0);
    const taxable = Math.max(subtotal - discount, 0);
    const vat = vatRate > 0 ? taxable * (vatRate / 100) : 0;
    const grand = taxable + vat;
    return { subtotal, discount, vat, vat_rate: vatRate, grand };
}
