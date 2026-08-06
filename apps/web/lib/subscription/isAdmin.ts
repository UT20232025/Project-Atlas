// Admin access is gated by an allowlist of emails in the ADMIN_EMAILS
// env (comma-separated), kept out of source so it isn't committed.
function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email: string): boolean {
  const admins = getAdminEmails();
  return admins.includes(email.trim().toLowerCase());
}
