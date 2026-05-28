import { redirect } from "next/navigation";

import { TEST_MAKER_ROUTES } from "@/lib/test-maker/constants";

export default function TestMakerIndexPage() {
  redirect(TEST_MAKER_ROUTES.olusturucu);
}
