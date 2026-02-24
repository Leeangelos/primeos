/**
 * Cookie-based storage for Supabase Auth so the session persists in iOS PWA/standalone mode.
 * PrimeOS uses Supabase Auth (not NextAuth). Standalone uses a separate cookie jar from Safari;
 * cookies with sameSite: "lax" and secure: true in production persist correctly in standalone.
 */

const COOKIE_PREFIX = "primeos_sb_";
const MAX_AGE_DAYS = 365;
const isProduction = typeof process !== "undefined" && process.env.NODE_ENV === "production";

function cookieName(key: string): string {
  return COOKIE_PREFIX + key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + encodeURIComponent(name) + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const opts = [
    "path=/",
    "sameSite=lax",
    ...(isProduction ? ["secure"] : []),
    "max-age=" + MAX_AGE_DAYS * 86400,
  ].join("; ");
  document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; " + opts;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = encodeURIComponent(name) + "=; path=/; max-age=0";
}

/**
 * Storage adapter for Supabase Auth that uses cookies so PWA/standalone (e.g. iOS Add to Home Screen) persists session.
 * Use only in the browser (pass to createClient when typeof window !== 'undefined').
 */
export function createCookieStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} {
  return {
    getItem: async (key: string) => {
      const name = cookieName(key);
      const value = getCookie(name);
      return value ?? null;
    },
    setItem: async (key: string, value: string) => {
      setCookie(cookieName(key), value);
    },
    removeItem: async (key: string) => {
      removeCookie(cookieName(key));
    },
  };
}
