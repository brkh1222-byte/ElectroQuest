import { notFound } from "next/navigation";
import { BuildMode } from "@/components/BuildMode";
import { recipeById, recipes } from "@/lib/data";

export function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: PageProps<"/build/[id]">) {
  const { id } = await params;
  if (!recipeById(id)) notFound();
  return <BuildMode id={id} />;
}
