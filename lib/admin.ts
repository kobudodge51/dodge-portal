import { cookies } from "next/headers";
import { sha } from "./security";

const COOKIE = "dp_admin";

export function adminToken() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return sha("admin:" + pw + (process.env.IP_SALT || ""));
}

export async function isAdmin() {
  const token = adminToken();
  if (!token) return false;
  const c = await cookies();
  return c.get(COOKIE)?.value === token;
}

export async function setAdminCookie() {
  const token = adminToken();
  if (!token) return;
  const c = await cookies();
  c.set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
}

export async function clearAdminCookie() {
  const c = await cookies();
  c.delete(COOKIE);
}
