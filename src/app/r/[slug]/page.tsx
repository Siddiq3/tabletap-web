import { notFound } from "next/navigation";
import { ApiError } from "@/contract";
import { publicApi } from "@/lib/api";
import { GuestMenu } from "./GuestMenu";

export const dynamic = "force-dynamic";

export default async function GuestMenuPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { t?: string };
}) {
  try {
    const { restaurant, table, menu } = await publicApi.publicMenu(params.slug, searchParams.t);
    return <GuestMenu restaurant={restaurant} table={table} menu={menu} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
