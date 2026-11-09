import { createApiClient } from "@/contract";

const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** For server components: guest pages only, no login token. */
export const publicApi = createApiClient(base, async () => null);
