export type CategoryVisibilityInput = {
  id: number;
  slug: string;
  parentId: number | null;
  productCount: number;
};

export function getCategorySlugsVisibleInCatalog(categories: CategoryVisibilityInput[]): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const visibleIds = new Set(
    categories.filter((category) => category.productCount > 0).map((category) => category.id)
  );

  for (const category of categories) {
    if (!visibleIds.has(category.id)) continue;

    let parentId = category.parentId;
    while (parentId != null) {
      visibleIds.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
  }

  return categories.filter((category) => visibleIds.has(category.id)).map((category) => category.slug);
}
