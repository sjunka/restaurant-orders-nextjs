import type { OrderStatus } from "@/shared/types/order";

const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-gray-100 text-gray-700" },
  CONFIRMED: { label: "Confirmed", classes: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "Preparing", classes: "bg-yellow-100 text-yellow-700" },
  READY: { label: "Ready for Pickup", classes: "bg-green-100 text-green-700" },
  DELIVERED: { label: "Delivered", classes: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Failed", classes: "bg-red-100 text-red-700" },
};

interface Props {
  status: OrderStatus;
  large?: boolean;
}

export function OrderStatusBadge({ status, large }: Props) {
  const { label, classes } = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${classes} ${
        large ? "text-base px-4 py-2" : "text-xs px-2.5 py-0.5"
      }`}
    >
      {label}
    </span>
  );
}
