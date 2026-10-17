/** Catalog composition shown in lists and DnD source panels. */
export interface GroupCatalogMeta {
  layerCount?: number;
  nestedGroupCount?: number;
  nestingLevel?: number;
  /** Map placement: toggled = "Toggla alla-knapp" in legacy admin. */
  toggleAllEnabled?: boolean;
}
