const SKIP_EMAILS = [
  "leeangelos.corp@gmail.com",
  "greg.leeangelos@gmail.com",
  "lmg.11@yahoo.com",
];

export type SessionLike = {
  user?: {
    email?: string | null;
    user_metadata?: { store_name?: string } | null;
  } | null;
} | null;

export function isNewUser(session: SessionLike): boolean {
  if (!session?.user) return false;
  const email = (session.user.email ?? "").toLowerCase();
  if (SKIP_EMAILS.includes(email)) return false;
  return !!(session.user.user_metadata?.store_name);
}

export function getNewUserStoreName(session: SessionLike): string {
  return (session?.user?.user_metadata?.store_name as string) || "My Store";
}
