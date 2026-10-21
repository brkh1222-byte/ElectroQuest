/** Where a track step links: its lesson when it has one, otherwise straight to the problem. */
export function stepHref(trackSlug: string, step: { slug: string; lessonTitle: string | null }) {
  return step.lessonTitle ? `/tracks/${trackSlug}/${step.slug}` : `/problems/${step.slug}`;
}
