import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SectionHeading } from "@/components/site/SectionHeading";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Price } from "@/components/ui/Price";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";

// Dev-only living style guide at /_styleguide (roadmap Phase 2). The folder is named %5Fstyleguide
// because App Router treats folders starting with "_" as private.
export const metadata: Metadata = { title: "Style guide", robots: { index: false } };

const COLORS = [
  ["bg", "bg-bg"],
  ["surface", "bg-surface"],
  ["sand", "bg-sand"],
  ["line", "bg-line"],
  ["ink", "bg-ink"],
  ["ink-soft", "bg-ink-soft"],
  ["muted", "bg-muted"],
  ["walnut", "bg-walnut"],
  ["walnut-dark", "bg-walnut-dark"],
  ["sale", "bg-sale"],
  ["success", "bg-success"],
  ["danger", "bg-danger"],
  ["whatsapp", "bg-whatsapp"],
  ["whatsapp-dark", "bg-whatsapp-dark"],
] as const;

const TYPE = [
  ["text-display", "Crafted for modern homes"],
  ["text-h1", "Signature L-Shape Sofa"],
  ["text-h2", "New arrivals"],
  ["text-h3", "Dining tables"],
  ["text-eyebrow text-walnut", "Featured collection"],
  [
    "text-body-lg",
    "Deep seats, solid mahogany frame, and a linen-blend weave that softens with time.",
  ],
  ["text-body", "Body copy for everyday reading. Calm, confident, warm. Short sentences."],
  ["text-small text-muted", "Small meta text, captions and breadcrumbs."],
  ["text-price text-ink", "৳ 1,25,000"],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-line border-t py-12">
      <h2 className="text-h3 mb-6">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Container className="py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Style guide" }]} />
      <h1 className="text-h1 mt-6 mb-10">Style guide</h1>

      <Section title="Colours">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map(([name, cls]) => (
            <li key={name} className="text-small">
              <div className={`${cls} border-line mb-2 h-16 border`} />
              {name}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-6">
          {TYPE.map(([cls, sample]) => (
            <div key={cls} className="grid gap-1 md:grid-cols-[12rem_1fr] md:items-baseline">
              <code className="text-small text-muted">{cls}</code>
              <p className={cls}>{sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <ButtonLink href="https://wa.me/" external variant="whatsapp">
            <WhatsAppIcon className="size-4" />
            Message on WhatsApp
          </ButtonLink>
          <Button size="lg">Large primary</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges & prices">
        <div className="flex flex-wrap gap-3">
          <Badge variant="sale">-15%</Badge>
          <Badge variant="new">New</Badge>
          <Badge>Made to order</Badge>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <Price regularPrice={45500} />
          <Price regularPrice={45500} discountPrice={38675} showBadge />
          <Price regularPrice={null} />
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-xl gap-6">
          <Field label="Product title" hint="Shown on cards and the product page.">
            <Input placeholder="Signature L-Shape Sofa" />
          </Field>
          <Field label="Slug" error="This slug is already used by another product.">
            <Input defaultValue="signature-sofa" />
          </Field>
          <Field label="Category">
            <Select defaultValue="sofas">
              <option value="sofas">Sofas</option>
              <option value="beds">Beds</option>
            </Select>
          </Field>
          <Field label="Short description">
            <Textarea placeholder="One or two sentences." />
          </Field>
        </div>
      </Section>

      <Section title="Section heading">
        <SectionHeading
          eyebrow="New arrivals"
          title="Fresh from the workshop"
          link={{ href: "/products", label: "View all" }}
        />
      </Section>

      <Section title="Skeleton">
        <div className="grid max-w-md grid-cols-2 gap-4">
          <Skeleton className="aspect-[4/5]" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Section>
    </Container>
  );
}
