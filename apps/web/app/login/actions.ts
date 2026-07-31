"use server";

import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  const isValid = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !isValid) {
    redirect("/login?error=invalid_credentials");
  }

  await createSessionCookie(user.id, user.email);
  redirect("/");
}
