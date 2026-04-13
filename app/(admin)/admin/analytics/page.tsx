import dynamic from "next/dynamic";
import { MetricCardSkeletonGrid } from "@/components/ui/loading-skeletons";

const AdminAnalyticsScreen = dynamic(
  () => import("@/components/admin/admin-analytics-screen").then((mod) => mod.AdminAnalyticsScreen),
  { loading: () => <MetricCardSkeletonGrid /> },
);

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsScreen />;
}
