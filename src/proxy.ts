import type { NextRequest } from "next/server";
import { updateAdminSession } from "@/features/auth/proxy";

/*
 * Runs before /admin requests only: keeps the admin's session fresh and sends signed-out
 * visitors to the sign-in page. Public pages never pass through here, so they stay static.
 */
export async function proxy(request: NextRequest) {
  return updateAdminSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
