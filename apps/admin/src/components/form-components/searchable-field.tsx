import React, { createContext, useContext } from "react";
import { matchesSettingsSearch } from "./settings-search-match";
import { useSettingsSearchLabels } from "../../hooks/use-settings-search-labels";

interface PanelSearchScope {
  showAllFields: boolean;
}

const PanelSearchScopeContext = createContext<PanelSearchScope | null>(null);

interface SearchableFieldProps {
  keywords: string[];
  fields?: string[];
  allValues?: Record<string, unknown>;
  searchTerm: string;
  children: React.ReactNode;
}

export function SearchableField({
  keywords,
  fields = [],
  allValues,
  searchTerm,
  children,
}: SearchableFieldProps) {
  const scope = useContext(PanelSearchScopeContext);

  if (!searchTerm.trim()) return <>{children}</>;
  if (scope?.showAllFields) return <>{children}</>;
  if (!matchesSettingsSearch(searchTerm, keywords, fields, allValues)) {
    return null;
  }

  return <>{children}</>;
}

interface SettingsSearchFieldProps {
  labelKeys: string[];
  fields?: string[];
  synonyms?: string[];
  allValues?: Record<string, unknown>;
  searchTerm: string;
  children: React.ReactNode;
}

/** Wraps one form field row; keywords come from translated label keys. */
export function SettingsSearchField({
  labelKeys,
  fields = [],
  synonyms = [],
  allValues,
  searchTerm,
  children,
}: SettingsSearchFieldProps) {
  const settingsSearchLabels = useSettingsSearchLabels();
  const keywords = [...settingsSearchLabels(...labelKeys), ...synonyms];

  return (
    <SearchableField
      keywords={keywords}
      fields={fields}
      allValues={allValues}
      searchTerm={searchTerm}
    >
      {/* display:contents keeps the layout; the attributes feed the DOM search. */}
      <span
        data-settings-field=""
        data-settings-keywords={keywords.join(" ")}
        style={{ display: "contents" }}
      >
        {children}
      </span>
    </SearchableField>
  );
}

export function PanelSearchScopeProvider({
  panelTitleKeywords,
  searchTerm,
  children,
}: {
  panelTitleKeywords: string[];
  searchTerm: string;
  children: React.ReactNode;
}) {
  const showAllFields =
    Boolean(searchTerm.trim()) &&
    panelTitleKeywords.length > 0 &&
    matchesSettingsSearch(searchTerm, panelTitleKeywords, [], {});

  return (
    <PanelSearchScopeContext.Provider value={{ showAllFields }}>
      {children}
    </PanelSearchScopeContext.Provider>
  );
}
