import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const ALLOWED_PROTOCOLS = /^(https?:|mailto:|tel:)/i;

/** Only http(s), mailto, tel and relative URLs survive (09 §4); anything else is dropped. */
export function safeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  return ALLOWED_PROTOCOLS.test(trimmed) ? trimmed : "";
}

const components: Components = {
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
  h2: ({ children }) => <h2 className="text-h3 mt-8 mb-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-ink mt-6 mb-2 text-lg font-medium">{children}</h3>,
  p: ({ children }) => <p className="mb-4">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5">{children}</ol>,
  strong: ({ children }) => <strong className="text-ink font-semibold">{children}</strong>,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-line border-b py-2 pr-4 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-line border-b py-2 pr-4">{children}</td>,
  // Raw HTML is never rendered (no rehype-raw, AGENTS §4.6); images in descriptions aren't allowed.
  img: () => null,
};

/** Admin-written Markdown (product descriptions, blog, about). Server component, no client JS. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-body-lg max-w-prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={safeUrl}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
