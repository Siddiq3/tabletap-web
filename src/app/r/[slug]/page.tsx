import { notFound } from "next/navigation";
import { ApiError } from "@/contract";
import { publicApi } from "@/lib/api";
import { GuestMenu } from "./GuestMenu";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
};

export default async function GuestMenuPage(props: Props) {
  const { slug } = await props.params;
  const { t } = await props.searchParams;
  try {
    // ?t=a&t=b arrives as an array; use the first table id.
    const { restaurant, table, menu } = await publicApi.publicMenu(slug, Array.isArray(t) ? t[0] : t);
    return <GuestMenu restaurant={restaurant} table={table} menu={menu} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
