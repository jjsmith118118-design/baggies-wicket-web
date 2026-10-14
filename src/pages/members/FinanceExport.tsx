import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { formatPence, xeroAccountFor, XERO_TAX_TYPE, type Order, type Profile } from "@/lib/members";

// Xero's sales invoice import template (UK). Keep these headings exactly.
const XERO_HEADERS = [
  "*ContactName", "EmailAddress", "POAddressLine1", "POAddressLine2", "POAddressLine3", "POAddressLine4",
  "POCity", "PORegion", "POPostalCode", "POCountry", "*InvoiceNumber", "Reference", "*InvoiceDate", "*DueDate",
  "Total", "InventoryItemCode", "*Description", "*Quantity", "*UnitAmount", "Discount", "*AccountCode",
  "*TaxType", "TaxAmount", "TrackingName1", "TrackingOption1", "TrackingName2", "TrackingOption2", "Currency", "BrandingTheme",
];

const ukDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB"); // DD/MM/YYYY
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const thisMonth = () => new Date().toISOString().slice(0, 7);

export function FinanceExport({ orders, parents }: { orders: Order[]; parents: Profile[] }) {
  const [month, setMonth] = useState(thisMonth());

  const monthOrders = useMemo(
    () => orders.filter((o) => o.status === "paid" && (o.paid_at ?? o.created_at).slice(0, 7) === month),
    [orders, month],
  );

  const summary = useMemo(() => {
    const byAccount = new Map<string, { name: string; pence: number }>();
    let discounts = 0;
    for (const o of monthOrders) {
      for (const i of o.order_items) {
        const acc = xeroAccountFor({ category: i.category, age_group: i.products?.age_group ?? null, name: i.products?.name ?? i.description, xero_account_code: i.products?.xero_account_code });
        const row = byAccount.get(acc.code) ?? { name: acc.name, pence: 0 };
        row.pence += i.unit_price_pence * i.quantity;
        byAccount.set(acc.code, row);
        if (i.full_price_pence) discounts += (i.full_price_pence - i.unit_price_pence) * i.quantity;
      }
    }
    const total = [...byAccount.values()].reduce((s, r) => s + r.pence, 0);
    return { rows: [...byAccount].sort(([a], [b]) => a.localeCompare(b)), total, discounts };
  }, [monthOrders]);

  const download = () => {
    const parentMap = new Map(parents.map((p) => [p.id, p]));
    const lines: string[] = [XERO_HEADERS.map(csvCell).join(",")];
    for (const o of monthOrders) {
      const payer = parentMap.get(o.parent_id);
      const contact = payer?.full_name?.trim() || payer?.email || "Members area customer";
      const date = ukDate(o.paid_at ?? o.created_at);
      const invoiceNo = `WEB-${o.id.slice(0, 8).toUpperCase()}`;
      const reference = o.stripe_payment_intent ? `Stripe ${o.stripe_payment_intent}` : "Members area";
      for (const i of o.order_items) {
        const acc = xeroAccountFor({ category: i.category, age_group: i.products?.age_group ?? null, name: i.products?.name ?? i.description, xero_account_code: i.products?.xero_account_code });
        const row: Record<string, string | number> = {
          "*ContactName": contact,
          EmailAddress: payer?.email ?? "",
          "*InvoiceNumber": invoiceNo,
          Reference: reference,
          "*InvoiceDate": date,
          "*DueDate": date,
          "*Description": i.description,
          "*Quantity": i.quantity,
          "*UnitAmount": (i.unit_price_pence / 100).toFixed(2),
          "*AccountCode": acc.code,
          "*TaxType": XERO_TAX_TYPE,
          Currency: "GBP",
        };
        lines.push(XERO_HEADERS.map((h) => csvCell(row[h] ?? "")).join(","));
      }
    }
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `kbcc-xero-invoices-${month}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-1">Finance: export to Xero</h2>
      <p className="text-muted-foreground mb-5">
        Download a month's payments as Xero sales invoices, already split by account. Import them in Xero, then match each Stripe
        payment to its invoice in bank reconciliation.
      </p>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="finance-month">Month</Label>
              <Input id="finance-month" type="month" value={month} max={thisMonth()} onChange={(e) => setMonth(e.target.value)} className="w-48" />
            </div>
            <Button onClick={download} disabled={monthOrders.length === 0}>
              <Download /> Download Xero invoices ({monthOrders.length})
            </Button>
          </div>

          {monthOrders.length === 0 ? (
            <p className="text-muted-foreground">No paid orders in this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Xero account</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map(([code, r]) => (
                    <tr key={code} className="border-b border-border">
                      <td className="py-2 pr-4">{code} {r.name}</td>
                      <td className="py-2 text-right">{formatPence(r.pence)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pr-4">Total received (before Stripe fees)</td>
                    <td className="py-2 text-right">{formatPence(summary.total)}</td>
                  </tr>
                </tbody>
              </table>
              {summary.discounts > 0 && (
                <p className="text-xs text-muted-foreground mt-2">Sibling and family discounts given this month: {formatPence(summary.discounts)}</p>
              )}
            </div>
          )}

          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">How to import into Xero</summary>
            <ol className="list-decimal pl-5 mt-3 space-y-1.5">
              <li>In Xero, go to <strong>Sales → Invoices → Import</strong> and upload the file.</li>
              <li>Choose to import them as <strong>Approved</strong> invoices.</li>
              <li>Go to <strong>Accounting → Bank accounts → your Stripe account → Reconcile</strong>. Each payment matches its invoice by amount, so click <strong>OK</strong>.</li>
              <li>Code Stripe's fee lines to <strong>1013 Stripe Fees</strong> (a bank rule can do this automatically).</li>
              <li>Refunds after export: raise a credit note against the invoice in Xero.</li>
            </ol>
          </details>
        </CardContent>
      </Card>
    </section>
  );
}
