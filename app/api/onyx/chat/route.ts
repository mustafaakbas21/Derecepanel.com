import { handleOnyxPost } from "@/lib/onyx/api-handler";

/** @deprecated — `/api/onyx` kullanın */
export async function POST(request: Request) {
  return handleOnyxPost(request);
}
