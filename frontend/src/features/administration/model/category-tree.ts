import type { AdminCategory } from "./contracts";

export function categoryRows(
  categories: AdminCategory[],
): { category: AdminCategory; depth: number }[] {
  const ids = new Set(categories.map((category) => category.id));
  const children = new Map<number | null, AdminCategory[]>();
  for (const category of categories) {
    const parent =
      category.parentId !== null && ids.has(category.parentId) ? category.parentId : null;

    const siblings = children.get(parent) ?? [];
    siblings.push(category);
    children.set(parent, siblings);
  }

  const rows: { category: AdminCategory; depth: number }[] = [];
  const visited = new Set<number>();

  function visit(category: AdminCategory, depth: number) {
    if (visited.has(category.id)) return;

    visited.add(category.id);
    rows.push({ category, depth });
    for (const child of children.get(category.id) ?? []) visit(child, depth + 1);
  }

  for (const root of children.get(null) ?? []) visit(root, 0);

  // Keep malformed cyclic branches visible without traversing them indefinitely.
  for (const category of categories) if (!visited.has(category.id)) visit(category, 0);

  return rows;
}
