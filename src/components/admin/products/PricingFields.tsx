"use client";
// Regular + discount price with a live preview of how the price will look (07 §3.2, F1.3).
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Price } from "@/components/ui/Price";
import { AdminField } from "../AdminForm";

function toAmount(value: string): number | null {
  const digits = value.replace(/[৳,\s]/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

export function PricingFields({
  regularPrice,
  discountPrice,
}: {
  regularPrice: number | null;
  discountPrice: number | null;
}) {
  const [regular, setRegular] = useState(regularPrice?.toString() ?? "");
  const [discount, setDiscount] = useState(discountPrice?.toString() ?? "");
  const regularAmount = toAmount(regular);
  const discountAmount = toAmount(discount);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField
          name="regularPrice"
          label="Regular price (৳)"
          hint="Leave blank to show “Price on request”."
        >
          <Input
            name="regularPrice"
            inputMode="numeric"
            value={regular}
            onChange={(e) => setRegular(e.target.value)}
            placeholder="45500"
            maxLength={14}
          />
        </AdminField>
        <AdminField name="discountPrice" label="Discount price (৳, optional)" hint="Must be lower.">
          <Input
            name="discountPrice"
            inputMode="numeric"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="38675"
            maxLength={14}
          />
        </AdminField>
      </div>
      <div className="bg-bg rounded-md px-4 py-3" aria-live="polite">
        <p className="text-small text-muted mb-1">Shown on the website as</p>
        <Price regularPrice={regularAmount} discountPrice={discountAmount} showBadge />
      </div>
    </>
  );
}
