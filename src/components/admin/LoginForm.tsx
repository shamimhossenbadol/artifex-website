"use client";
import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { loginAction } from "@/server/actions/auth.actions";
import { FormMessage, fieldError } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" error={fieldError(state, "email")}>
        <Input name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" error={fieldError(state, "password")}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton fullWidth size="lg" pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
