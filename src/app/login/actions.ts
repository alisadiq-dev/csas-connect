"use server";

import { redirect } from "next/navigation";
import { isRealSupabaseConfigured, signInWithPasswordViaSupabase, verifyLocalCredentials } from "@/lib/identity/auth";
import { determineRole } from "@/lib/identity/roles";
import { createSession } from "@/lib/identity/session";

export type LoginState = { error: string | null };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const result = isRealSupabaseConfigured()
    ? await signInWithPasswordViaSupabase({ email, password })
    : await verifyLocalCredentials(email, password);

  if (!result) {
    return { error: "Incorrect email or password." };
  }

  const role = await determineRole(result.userId);
  if (!role) {
    return { error: "This account has no role assigned. Contact an admin." };
  }

  await createSession(result.userId, role);
  redirect(`/${role}`);
}
