import type { NextRequest } from "next/server";
import { confirmSignIn } from "@/features/auth";

/** The emailed sign-in link lands here, then redirects to the News queue. */
export async function GET(request: NextRequest) {
  return confirmSignIn(request);
}
