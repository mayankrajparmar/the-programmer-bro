import { redirect } from "next/navigation";
import { ADMIN_HOME } from "@/features/auth";

export default function Page() {
  redirect(ADMIN_HOME);
}
