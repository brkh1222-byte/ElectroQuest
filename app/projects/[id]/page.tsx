import { notFound } from "next/navigation";
import { RecipeDetail } from "@/components/RecipeDetail";
import { recipeById, recipes } from "@/lib/data";

export function generateStaticParams() {
  return recipes.map((r) => ({ id: r.id }));
}

export default async function Page({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  if (!recipeById(id)) notFound();
  return <RecipeDetail id={id} />;
}
