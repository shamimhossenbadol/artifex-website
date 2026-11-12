"use client";
import { useActionState, useEffect, useRef } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { changePasswordAction } from "@/server/actions/auth.actions";
import { FormMessage, fieldError } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/** Change password (07 §1). On a forced change the action redirects to the dashboard. */
export function ChangePasswordForm({ submitLabel = "Change password" }: { submitLabel?: string }) {
  const [state, action] = useActionState(changePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage state={state} />
      <Field label="Current password" error={fieldError(state, "currentPassword")}>
        <Input name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field
        label="New password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters. Avoid common words and your email.`}
        error={fieldError(state, "newPassword")}
      >
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      </Field>
      <Field label="Confirm new password" error={fieldError(state, "confirmPassword")}>
        <Input name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
