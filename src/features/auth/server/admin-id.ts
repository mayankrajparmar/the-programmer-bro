/** Who the admin is, with no Next.js imports so the proxy can use it too. */

export const LOGIN_PATH = "/admin/login";
export const ADMIN_HOME = "/admin/news";

/** True when `id` is the user id in ADMIN_USER_ID. Nobody is the admin until it's set. */
export function isAdminId(id: string | undefined | null): boolean {
  const admin = process.env.ADMIN_USER_ID?.trim();
  return Boolean(admin && id && id === admin);
}
