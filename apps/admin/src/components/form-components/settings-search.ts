import { createContext, useContext } from "react";

/**
 * `null` outside a search tab: fields render exactly as usual.
 * A string (including "") means the search tab is open. The text itself is
 * applied to the DOM by `applySettingsSearch`, so typing does not re-render
 * the form.
 */
export const SettingsSearchTermContext = createContext<string | null>(null);

export function useSettingsSearchTerm(): string | null {
  return useContext(SettingsSearchTermContext);
}

/** Label text plus aria-labels, so a checkbox label is searchable. */
function fieldSearchText(field: HTMLElement): string {
  const labels = Array.from(
    field.querySelectorAll<HTMLElement>(
      "label, .MuiFormControlLabel-label, .MuiFormLabel-root, [aria-label]",
    ),
  ).map(
    (element) => element.getAttribute("aria-label") ?? element.textContent ?? "",
  );
  return [field.textContent ?? "", ...labels].join(" ");
}

/**
 * Rows the search can show or hide. Grid checkboxes are not inside a
 * FormFieldGrid, so their labels have to be picked up from the control itself.
 */
function searchTargets(root: ParentNode): HTMLElement[] {
  const marked = Array.from(
    root.querySelectorAll<HTMLElement>("[data-settings-field]"),
  );
  const controls = Array.from(
    root.querySelectorAll<HTMLElement>(
      ".MuiFormControl-root, .MuiFormControlLabel-root",
    ),
  ).filter((control) => {
    if (control.closest("[data-settings-field]")) return false;
    return !control.parentElement?.closest(
      ".MuiFormControl-root, .MuiFormControlLabel-root",
    );
  });

  const targets = new Set<HTMLElement>();
  for (const element of [...marked, ...controls]) {
    const gridItem = element.closest<HTMLElement>(".MuiGrid-root");
    const item =
      gridItem &&
      gridItem !== element &&
      !gridItem.classList.contains("MuiGrid-container")
        ? gridItem
        : element;
    targets.add(item);
  }
  return Array.from(targets);
}

/** Every word in the query must appear in the field's visible text. */
export function fieldTextMatches(term: string, text: string): boolean {
  const words = term.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = text.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/**
 * Shows or hides `[data-settings-field]` / `[data-settings-section]` under
 * `root`. Returns whether nothing matched. Touches the DOM only, so the form
 * does not re-render.
 */
export function applySettingsSearch(
  root: HTMLElement | null,
  term: string,
): boolean {
  if (!root) return false;
  const fields = searchTargets(root);
  const sections = root.querySelectorAll<HTMLElement>(
    "[data-settings-section]",
  );
  const needle = term.trim();

  if (!needle) {
    root.querySelectorAll("[data-settings-hidden]").forEach((element) => {
      element.removeAttribute("data-settings-hidden");
    });
    sections.forEach((section) => {
      section.removeAttribute("data-settings-show-all");
    });
    return false;
  }

  sections.forEach((section) => {
    const title = section.getAttribute("data-settings-title") ?? "";
    if (fieldTextMatches(needle, title)) {
      section.setAttribute("data-settings-show-all", "");
    } else {
      section.removeAttribute("data-settings-show-all");
    }
  });

  fields.forEach((field) => {
    const matches =
      field.closest("[data-settings-show-all]") != null ||
      fieldTextMatches(needle, fieldSearchText(field));
    if (matches) field.removeAttribute("data-settings-hidden");
    else field.setAttribute("data-settings-hidden", "");
  });

  const deepestFirst = Array.from(sections).sort((a, b) => {
    const depth = (element: HTMLElement) => {
      let levels = 0;
      let node: HTMLElement | null = element;
      while (node && node !== root) {
        levels += 1;
        node = node.parentElement;
      }
      return levels;
    };
    return depth(b) - depth(a);
  });

  deepestFirst.forEach((section) => {
    if (section.hasAttribute("data-settings-show-all")) {
      section.removeAttribute("data-settings-hidden");
      return;
    }
    const visibleField = searchTargets(section).find(
      (target) => !target.hasAttribute("data-settings-hidden"),
    );
    const visibleNested = section.querySelector(
      "[data-settings-section]:not([data-settings-hidden])",
    );
    if (visibleField || visibleNested) {
      section.removeAttribute("data-settings-hidden");
    } else {
      section.setAttribute("data-settings-hidden", "");
    }
  });

  syncMatchingAccordions(root, needle);

  if (sections.length > 0) {
    return Array.from(sections).every((section) =>
      section.hasAttribute("data-settings-hidden"),
    );
  }
  return (
    fields.length > 0 &&
    Array.from(fields).every((field) =>
      field.hasAttribute("data-settings-hidden"),
    )
  );
}

export const SETTINGS_SEARCH_OPEN = "settingssearchopen";
export const SETTINGS_SEARCH_CLOSE = "settingssearchclose";

/** Opens every section that has a match, and closes only the ones this search opened. */
function syncMatchingAccordions(root: HTMLElement, needle: string) {
  root.querySelectorAll<HTMLElement>("[data-settings-section]").forEach((section) => {
    const matched = Boolean(needle) && !section.hasAttribute("data-settings-hidden");
    section.dispatchEvent(
      new Event(matched ? SETTINGS_SEARCH_OPEN : SETTINGS_SEARCH_CLOSE),
    );
  });
}

