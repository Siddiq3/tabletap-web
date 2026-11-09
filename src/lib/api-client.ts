"use client";
import { createApiClient } from "@/contract";
import { getToken } from "./auth";

/** For the browser: sends the staff member's login token with every call. */
export const api = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", getToken);
