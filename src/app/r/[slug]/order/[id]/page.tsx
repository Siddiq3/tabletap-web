import { notFound } from "next/navigation";
import { ApiError } from "@/contract";
import { publicApi } from "@/lib/api";
import { OrderTracker } from "./OrderTracker";

export const dynamic = "force-dynamic";

export default async function OrderPage(props: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await props.params;
  try {
    const { restaurant, order } = await publicApi.publicOrder(slug, id);
    return <OrderTracker initial={order} restaurant={restaurant} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
