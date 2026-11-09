import { notFound } from "next/navigation";
import { ApiError } from "@/contract";
import { publicApi } from "@/lib/api";
import { OrderTracker } from "./OrderTracker";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { slug: string; id: string } }) {
  try {
    const { restaurant, order } = await publicApi.publicOrder(params.slug, params.id);
    return <OrderTracker initial={order} restaurant={restaurant} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
