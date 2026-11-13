import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildImageUrl } from "@/lib/image-variants";
import { cn } from "@/lib/utils";

const ALLOWED_PROTOCOLS = /^(https?:|mailto:|tel:)/i;
const KEY_BASE = /^(products|categories|blog|home|site)\/\d{4}\/\d{2}\/[a-z0-9]{12}$/;
const MEDIA_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_MEDIA_URL ?? "").origin;
  } catch {
    return null;
  }
})();

/** Only http(s), mailto, tel and relative URLs survive (09 §4); anything else is dropped. */
export function safeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return ALLOWED_PROTOCOLS.test(trimmed) ? trimmed : "";
}

/**
 * Images may only come from our own media: an R2 key base (inserted by the admin uploader, shown
 * as the 960 px variant) or a URL on the media domain. Anything else is dropped.
 */
export function safeImageUrl(url: string, mediaOrigin: string | null = MEDIA_ORIGIN): string {
  const trimmed = url.trim();
  if (KEY_BASE.test(trimmed)) return buildImageUrl(trimmed, 960);
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && parsed.origin === mediaOrigin ? parsed.href : "";
  } catch {
    return "";
  }
}

function buildComponents(allowImages: boolean): Components {
  return {
    a: ({ href, children }) => {
      const external = typeof href === "string" && /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-walnut hover:text-walnut-dark underline underline-offset-4"
        >
          {children}
        </a>
      );
    },
    h2: ({ children }) => <h2 className="text-h3 mt-10 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-ink mt-6 mb-2 text-lg font-medium">{children}</h3>,
    p: ({ children }) => <p className="mb-4">{children}</p>,
    ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>,
    strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="border-walnut text-ink my-6 border-l-2 pl-4 italic">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="relative mb-6 overflow-x-auto">
        <table className="w-full border-collapse text-left">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-line text-ink border-b py-2 pr-4 font-medium">{children}</th>
    ),
    td: ({ children }) => <td className="border-line border-b py-2 pr-4">{children}</td>,
    // Raw HTML is never rendered (no rehype-raw, AGENTS §4.6).
    img: ({ src, alt }) =>
      allowImages && typeof src === "string" && src ? (
        // Inline Markdown images have no stored dimensions, so next/image can't size them; they come
        // straight from the R2 CDN, lazy-loaded.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          className="bg-sand my-6 h-auto w-full"
        />
      ) : null,
  };
}

const PLAIN = buildComponents(false);
const WITH_IMAGES = buildComponents(true);

/** Admin-written Markdown (product descriptions, blog, about). Server component, no client JS. */
export function Markdown({
  children,
  className,
  allowImages = false,
}: {
  children: string;
  className?: string;
  /** Blog posts may include images from our own media (F4); product descriptions may not. */
  allowImages?: boolean;
}) {
  return (
    <div className={cn("text-body-lg max-w-prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={allowImages ? WITH_IMAGES : PLAIN}
        urlTransform={(url, key) => (key === "src" ? safeImageUrl(url) : safeUrl(url))}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
