import { ApiError } from "@/src/shared/api/client";
import { isRecord } from "@/src/shared/lib/validation";

export type Category = { id: number; name: string; parentId: number | null; depth: number };

export function parseActiveCategories(payload: unknown): Category[] {
  if (!isRecord(payload) || !Array.isArray(payload.data))
    throw new ApiError("Сервер вернул некорректный список категорий", 502);

  const result = new Map<number, Category>();
  let count = 0;

  function visit(
    nodes: unknown[],
    parentId: number | null,
    depth: number,
    ancestors: Set<number>,
  ): void {
    if (depth > 30 || (count += nodes.length) > 10_000)
      throw new ApiError("Некорректная структура категорий", 502);

    for (const node of nodes) {
      if (
        !isRecord(node) ||
        typeof node.id !== "number" ||
        !Number.isSafeInteger(node.id) ||
        node.id <= 0 ||
        typeof node.name !== "string" ||
        !node.name.trim() ||
        !Array.isArray(node.children) ||
        ancestors.has(node.id)
      )
        throw new ApiError("Сервер вернул некорректную категорию", 502);

      if (node.isActive === false) continue;

      const previous = result.get(node.id);
      if (!previous || parentId !== null)
        result.set(node.id, { id: node.id, name: node.name, parentId, depth });

      visit(node.children, node.id, depth + 1, new Set([...ancestors, node.id]));
    }
  }

  visit(payload.data, null, 0, new Set());

  return [...result.values()];
}
