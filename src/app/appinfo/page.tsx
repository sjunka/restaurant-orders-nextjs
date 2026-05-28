import type { Metadata } from "next";
import { AppInfoView } from "./AppInfoView";

export const metadata: Metadata = {
  title: "App Architecture | Eats",
  description: "Interactive reference for the Restaurant Ordering app — layers, files, database, API, and component map.",
};

export default function AppInfoPage() {
  return <AppInfoView />;
}
