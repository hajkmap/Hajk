import { SettingsSearchTermContext } from "./settings-search";

export function SettingsSearchTermProvider({
  term,
  children,
}: {
  term: string | null;
  children: React.ReactNode;
}) {
  return (
    <SettingsSearchTermContext.Provider value={term}>
      {children}
    </SettingsSearchTermContext.Provider>
  );
}
