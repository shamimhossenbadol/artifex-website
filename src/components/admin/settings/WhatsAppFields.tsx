"use client";
// Contact tab helpers (07 §3.6): WhatsApp number with a "Test link" button, and the product
// message template with placeholder help and a live preview.
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { normalizeWhatsAppNumber } from "@/lib/validation/settings";
import { AdminField } from "../AdminForm";

export function WhatsAppNumberField({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const digits = normalizeWhatsAppNumber(value);
  const valid = /^\d{8,15}$/.test(digits);

  return (
    <div className="flex flex-col gap-2">
      <AdminField
        name="whatsappNumber"
        label="WhatsApp number"
        hint="Type it any way, e.g. 01757-758388. It's saved in international format."
      >
        <Input
          name="whatsappNumber"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="tel"
          autoComplete="off"
          required
          maxLength={25}
        />
      </AdminField>
      <a
        href={
          valid
            ? buildWhatsAppUrl({ number: digits, message: "Test from the admin panel" })
            : undefined
        }
        aria-disabled={!valid}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium underline-offset-4 hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        <ExternalLink aria-hidden strokeWidth={1.5} className="size-4" />
        Test link (opens WhatsApp with wa.me/{valid ? digits : "…"})
      </a>
    </div>
  );
}

const SAMPLE = {
  product: "Signature L-Shape Sofa",
  color: "Walnut Brown",
  price: "৳ 85,000",
  url: "https://artifexfurniture.com/products/signature-l-shape-sofa",
};

export function ProductTemplateField({
  initial,
  businessName,
}: {
  initial: string;
  businessName: string;
}) {
  const [template, setTemplate] = useState(initial);
  const preview = buildProductMessage({ template, business: businessName, ...SAMPLE });

  return (
    <div className="flex flex-col gap-3">
      <AdminField
        name="whatsappProductTemplate"
        label="Product message"
        hint={
          <>
            Sent from the “Ask on WhatsApp” button on product pages. Placeholders:{" "}
            <code>{"{business}"}</code>, <code>{"{product}"}</code>, <code>{"{color}"}</code>,{" "}
            <code>{"{price}"}</code>, <code>{"{url}"}</code>.
          </>
        }
      >
        <Textarea
          name="whatsappProductTemplate"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          maxLength={300}
          required
        />
      </AdminField>
      <div className="bg-sand rounded-md p-4">
        <p className="text-eyebrow text-muted mb-2">Preview</p>
        <p className="text-small text-ink break-words whitespace-pre-wrap">{preview}</p>
      </div>
    </div>
  );
}
