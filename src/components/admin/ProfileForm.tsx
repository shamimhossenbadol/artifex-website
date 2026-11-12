"use client";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { updateProfileAction } from "@/server/actions/auth.actions";
import { FormMessage, fieldError } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/** Name and email; changing the email asks for the current password (07 §1). */
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState(updateProfileAction, null);
  const [currentEmail, setCurrentEmail] = useState(email);
  const emailChanged = currentEmail.trim().toLowerCase() !== email.toLowerCase();

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage state={state} />
      <Field label="Name" error={fieldError(state, "name")}>
        <Input name="name" defaultValue={name} autoComplete="name" required maxLength={80} />
      </Field>
      <Field label="Email (used to sign in)" error={fieldError(state, "email")}>
        <Input
          name="email"
          type="email"
          value={currentEmail}
          onChange={(e) => setCurrentEmail(e.target.value)}
          autoComplete="email"
          required
          maxLength={120}
        />
      </Field>
      {emailChanged && (
        <Field
          label="Current password"
          hint="Needed to change your sign-in email."
          error={fieldError(state, "currentPassword")}
        >
          <Input name="currentPassword" type="password" autoComplete="current-password" />
        </Field>
      )}
      <div>
        <SubmitButton>Save profile</SubmitButton>
      </div>
    </form>
  );
}
