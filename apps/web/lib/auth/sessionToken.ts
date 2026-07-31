import { jwtVerify } from "jose";

export const SESSION_COOKIE = "genwelth_session";

const encodedSecret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export type Session = {
  userId: string;
  email: string;
};

export async function verifySessionToken(
  token: string | undefined
): Promise<Session | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
