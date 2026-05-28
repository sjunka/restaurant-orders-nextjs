import type { Metadata } from "next";
import { OrderView } from "@/features/orders/components/OrderView";

export const metadata: Metadata = {
  title: "Order Status | Eats",
  description: "Track your order in real time",
};

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderStatusPage({ params }: Props) {
  const { orderId } = await params;
  return <OrderView orderId={orderId} />;
}
