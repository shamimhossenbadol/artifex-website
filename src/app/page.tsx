import { SITE_NAME, SITE_TAGLINE } from "@/config/site";

// Temporary placeholder. The real homepage is built in Phase 6 on top of the Phase 2 layout.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{SITE_NAME}</h1>
      <p className="text-lg">{SITE_TAGLINE}</p>
      <p className="text-sm">Our new website is on its way.</p>
    </main>
  );
}
