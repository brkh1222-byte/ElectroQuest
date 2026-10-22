import { notFound } from "next/navigation";
import { RepairFlow } from "@/components/repair/RepairFlow";
import { deviceById, devices } from "@/lib/data";

export function generateStaticParams() {
  return devices.map((d) => ({ device: d.id }));
}

export default async function Page({ params }: PageProps<"/fix/[device]">) {
  const { device } = await params;
  if (!deviceById(device)) notFound();
  return <RepairFlow deviceId={device} />;
}
