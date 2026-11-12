import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { safeAdminRedirect } from "@/lib/auth/rules";
import { getCurrentAdmin } from "@/server/services/auth.service";
import wordmark from "@/assets/brand/artifex-wordmark.svg";

export const metadata: Metadata = { title: "Sign in" };

async function LoginGate({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? safeAdminRedirect(params.next) : undefined;
  // Already signed in: go straight to the admin.
  if (await getCurrentAdmin()) redirect(next ?? "/admin");
  return <LoginForm next={next && next !== "/admin" ? next : undefined} />;
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="border-line bg-surface w-full max-w-sm rounded-md border p-6 sm:p-8">
        <Image src={wordmark} alt="Artifex Furniture" className="mx-auto h-10 w-auto" />
        <h1 className="text-h3 mt-6 text-center">Admin sign in</h1>
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="flex flex-col gap-4" aria-hidden>
                <Skeleton className="h-11" />
                <Skeleton className="h-11" />
                <Skeleton className="h-13" />
              </div>
            }
          >
            <LoginGate searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="text-small text-muted mt-6 text-center">
          Forgot your password? Ask your developer to run the password reset.
        </p>
      </div>
    </main>
  );
}
