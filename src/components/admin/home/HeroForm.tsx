"use client";
// Hero editor (07 §3.5): text fields with a small live preview over the first slide. The photos
// themselves are managed separately in <HeroSlides> (ADR-039).
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";
import { saveHeroAction } from "@/server/actions/home.actions";
import type { HeroForEdit } from "@/server/services/home-admin.service";
import { AdminField, AdminForm, FormSection } from "../AdminForm";

type Text = {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export function HeroForm({ hero, imagePath }: { hero: HeroForEdit; imagePath: string | null }) {
  const [text, setText] = useState<Text>({
    eyebrow: hero.eyebrow ?? "",
    heading: hero.heading,
    subheading: hero.subheading ?? "",
    ctaLabel: hero.ctaLabel,
    ctaHref: hero.ctaHref,
    secondaryLabel: hero.secondaryLabel ?? "",
    secondaryHref: hero.secondaryHref ?? "",
  });
  const bind = (key: keyof Text) => ({
    name: key,
    value: text[key],
    onChange: (e: { target: { value: string } }) =>
      setText((t) => ({ ...t, [key]: e.target.value })),
  });

  return (
    <AdminForm action={saveHeroAction} submitLabel="Save hero">
      <FormSection
        title="Preview"
        description="A small version of the top of the homepage, over the first photo."
      >
        <div
          className={cn(
            "relative isolate flex aspect-[4/3] items-end overflow-hidden rounded-md p-5 sm:aspect-[21/9] sm:items-center sm:p-8",
            imagePath ? "bg-ink" : "bg-bg border-line border",
          )}
        >
          {imagePath && (
            <>
              <Image src={imagePath} alt="" fill sizes="48rem" className="-z-10 object-cover" />
              <div aria-hidden className="bg-ink/35 absolute inset-0 -z-10" />
            </>
          )}
          <div className={cn("max-w-md", imagePath ? "text-bg" : "text-ink")}>
            {text.eyebrow && (
              <p className={cn("text-eyebrow", !imagePath && "text-walnut")}>{text.eyebrow}</p>
            )}
            <p className="text-h2 mt-2">{text.heading || "Heading"}</p>
            {text.subheading && <p className="text-small mt-2 opacity-90">{text.subheading}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium",
                  imagePath ? "bg-bg text-ink" : "bg-ink text-bg",
                )}
              >
                {text.ctaLabel || "Button"}
              </span>
              {text.secondaryLabel && (
                <span className="rounded-md border px-3 py-1.5 text-xs font-medium">
                  {text.secondaryLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Text">
        <AdminField name="eyebrow" label="Small line above the heading (optional)">
          <Input {...bind("eyebrow")} maxLength={60} />
        </AdminField>
        <AdminField name="heading" label="Heading">
          <Input {...bind("heading")} required maxLength={120} />
        </AdminField>
        <AdminField name="subheading" label="Subheading (optional)">
          <Textarea {...bind("subheading")} rows={2} maxLength={240} />
        </AdminField>
      </FormSection>

      <FormSection
        title="Buttons"
        description="Links can be site paths like /products or full https:// links."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField name="ctaLabel" label="Main button text">
            <Input {...bind("ctaLabel")} required maxLength={40} />
          </AdminField>
          <AdminField name="ctaHref" label="Main button link">
            <Input {...bind("ctaHref")} required maxLength={255} />
          </AdminField>
          <AdminField name="secondaryLabel" label="Second button text (optional)">
            <Input {...bind("secondaryLabel")} maxLength={40} />
          </AdminField>
          <AdminField name="secondaryHref" label="Second button link">
            <Input {...bind("secondaryHref")} maxLength={255} />
          </AdminField>
        </div>
      </FormSection>
    </AdminForm>
  );
}
