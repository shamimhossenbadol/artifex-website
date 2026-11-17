"use client";
// Price type (fixed / range / no price, ADR-076) with the matching inputs and a live preview of
// how the price will look (07 §3.2, F1.3).
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Price } from "@/components/ui/Price";
import type { PriceType } from "@/lib/validation/product";
import { AdminField, useAdminFormState } from "../AdminForm";

function toAmount(value: string): number | null {
  const digits = value.replace(/[৳,\s]/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

const TYPES: { value: PriceType; label: string; hint: string }[] = [
  { value: "fixed", label: "Fixed price", hint: "One price, with an optional discount." },
  {
    value: "range",
    label: "Price range",
    hint: "Shows “from – to” when you'd rather not share the exact price.",
  },
  {
    value: "quote",
    label: "No price",
    hint: "The product page shows a “Priced to your design” quote card.",
  },
];

export function PricingFields({
  regularPrice,
  discountPrice,
  maxPrice,
  defaultType,
}: {
  regularPrice: number | null;
  discountPrice: number | null;
  maxPrice: number | null;
  defaultType: PriceType;
}) {
  const { markDirty } = useAdminFormState();
  const [type, setType] = useState<PriceType>(defaultType);
  const [regular, setRegular] = useState(regularPrice?.toString() ?? "");
  const [discount, setDiscount] = useState(discountPrice?.toString() ?? "");
  const [max, setMax] = useState(maxPrice?.toString() ?? "");
  const regularAmount = toAmount(regular);

  return (
    <>
      <fieldset>
        <legend className="text-ink mb-2 font-medium">How is the price shown?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map((t) => (
            <label
              key={t.value}
              className="border-line has-[:checked]:border-ink flex cursor-pointer gap-3 rounded-md border px-4 py-3"
            >
              <input
                type="radio"
                name="priceType"
                value={t.value}
                checked={type === t.value}
                onChange={() => {
                  setType(t.value);
                  markDirty();
                }}
                className="accent-ink mt-1 size-4 shrink-0"
              />
              <span>
                <span className="text-ink block font-medium">{t.label}</span>
                <span className="text-small text-muted block">{t.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "fixed" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="regularPrice" label="Regular price (৳)">
            <Input
              name="regularPrice"
              inputMode="numeric"
              value={regular}
              onChange={(e) => setRegular(e.target.value)}
              placeholder="45500"
              maxLength={14}
            />
          </AdminField>
          <AdminField
            name="discountPrice"
            label="Discount price (৳, optional)"
            hint="Must be lower."
          >
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
      )}

      {type === "range" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="regularPrice" label="From (৳)" hint="The lowest price.">
            <Input
              name="regularPrice"
              inputMode="numeric"
              value={regular}
              onChange={(e) => setRegular(e.target.value)}
              placeholder="40000"
              maxLength={14}
            />
          </AdminField>
          <AdminField name="maxPrice" label="To (৳)" hint="The highest price.">
            <Input
              name="maxPrice"
              inputMode="numeric"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder="60000"
              maxLength={14}
            />
          </AdminField>
        </div>
      )}

      <div className="bg-bg rounded-md px-4 py-3" aria-live="polite">
        <p className="text-small text-muted mb-1">Shown on the website as</p>
        {type === "quote" || regularAmount === null ? (
          // ADR-063: no price → the product page shows the custom-quote card.
          <p className="text-ink font-medium">
            “Priced to your design” quote card (no price shown)
          </p>
        ) : (
          <Price
            regularPrice={regularAmount}
            discountPrice={type === "fixed" ? toAmount(discount) : null}
            maxPrice={type === "range" ? toAmount(max) : null}
            showBadge
          />
        )}
      </div>
    </>
  );
}
