"use server";

import { redirect } from "next/navigation";

import { claimOrphanedDataForFirstUser } from "@/lib/auth/claimOrphanedData";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email.includes("@") || password.length < 8) {
    redirect("/signup?error=invalid_input");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    redirect("/signup?error=email_taken");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  await claimOrphanedDataForFirstUser(user.id);
  await createSessionCookie(user.id, user.email);
  redirect("/");
}
