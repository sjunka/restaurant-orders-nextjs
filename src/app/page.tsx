import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Eats | Order Food Online",
  description: "Order food online with real-time order tracking",
};

export default function Home() {
  redirect("/menu");
}
