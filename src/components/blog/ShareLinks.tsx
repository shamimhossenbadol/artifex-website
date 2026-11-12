import { FacebookIcon } from "@/components/site/SocialIcons";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { CopyLinkButton } from "./CopyLinkButton";

const CHIP =
  "border-line text-ink hover:border-ink inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm transition-colors";

/** Share links for a post (F4): Facebook, WhatsApp and copy link. Only the copy button needs JS. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-small text-muted mr-2">Share</p>
      <a href={facebook} target="_blank" rel="noopener noreferrer" className={CHIP}>
        <FacebookIcon className="size-4" />
        Facebook
      </a>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={CHIP}>
        <WhatsAppIcon className="text-whatsapp-dark size-4" />
        WhatsApp
      </a>
      <CopyLinkButton url={url} className={CHIP} />
    </div>
  );
}
