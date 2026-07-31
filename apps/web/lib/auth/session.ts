import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  verifySessionToken,
  type Session,
} from "@/lib/auth/sessionToken";

export type { Session };

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const encodedSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function createSessionCookie(
  userId: string,
  email: string
): Promise<void> {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor((Date.now() + SESSION_DURATION_MS) / 1000)
    )
    .sign(encodedSecret);

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
