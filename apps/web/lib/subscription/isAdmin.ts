// The founder/owner always has admin access. Additional admins can be
// added via the ADMIN_EMAILS env (comma-separated). The hardcoded owner
// keeps the admin panel working even if the runtime env isn't set.
const OWNER_EMAILS = ["christer_gramstad@hotmail.com"];

function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return [...OWNER_EMAILS.map((e) => e.toLowerCase()), ...fromEnv];
}

export function isAdmin(email: string): boolean {
  const admins = getAdminEmails();
  return admins.includes(email.trim().toLowerCase());
}
