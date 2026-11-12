"use client";
import { useActionState } from "react";
import { logoutEverywhereAction } from "@/server/actions/auth.actions";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/** "Log out everywhere" (07 §3.7): bumps sessionVersion; this device stays signed in. */
export function LogoutEverywhereForm() {
  const [state, action] = useActionState(logoutEverywhereAction, null);
  return (
    <form action={action} className="flex flex-col items-start gap-4">
      <FormMessage state={state} />
      <SubmitButton variant="secondary" pendingText="Signing out devices…">
        Log out on all other devices
      </SubmitButton>
    </form>
  );
}
