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
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (!email.includes("@") || password.length < 8) {
    redirect("/signup?error=invalid_input");
  }

  const requiredInviteCode = process.env.BETA_INVITE_CODE;

  if (requiredInviteCode && inviteCode !== requiredInviteCode) {
    redirect("/signup?error=invalid_invite_code");
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
