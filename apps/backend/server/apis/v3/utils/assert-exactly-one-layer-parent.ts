/** Ensures a LayerInstance write references exactly one parent layer FK. */
export function assertExactlyOneLayerParent(input: {
  displayLayerId?: string | null;
  searchLayerId?: string | null;
  editingLayerId?: string | null;
}): void {
  const count = [
    input.displayLayerId,
    input.searchLayerId,
    input.editingLayerId,
  ].filter((value) => value != null && value !== "").length;
  if (count !== 1) {
    throw new Error(
      "LayerInstance must reference exactly one of displayLayerId, searchLayerId, or editingLayerId",
    );
  }
}
