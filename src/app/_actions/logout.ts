"use server";

import { signOut } from "@/lib/auth";

export async function logoutAction() {
  // signOut without redirectTo — let the client handle navigation
  await signOut({ redirect: false });
}
