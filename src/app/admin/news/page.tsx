import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNewsLoading, AdminNewsPage } from "@/features/news";

export const metadata: Metadata = { title: "News queue" };

/* Reads the admin's session, so the queue renders per request behind a loading state. */
export default function Page() {
  return (
    <Suspense fallback={<AdminNewsLoading />}>
      <AdminNewsPage />
    </Suspense>
  );
}
