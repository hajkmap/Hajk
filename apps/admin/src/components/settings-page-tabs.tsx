import type { ReactElement, ReactNode } from "react";
import { Tab, Tabs } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

/** Primary page tabs (Settings / Layers / …) — matches maps settings. */
export const settingsPageTabsSx = {
  mb: 2,
  "& .MuiTab-root": {
    color: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? theme.palette.common.white
        : theme.palette.common.black,
  },
  "& .MuiTab-root.Mui-selected": {
    color: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? theme.palette.common.white
        : theme.palette.common.black,
  },
  "& .MuiTab-icon": {
    color: "inherit",
  },
};

/** Nested section tabs inside a settings page (maps settings sections, tool sub-tabs). */
export const settingsSectionTabsSx = {
  mb: 2,
  minHeight: 36,
  pl: 1,
  borderLeft: 2,
  borderColor: "divider",
  "& .MuiTab-root": {
    minHeight: 36,
    fontSize: (theme: Theme) => theme.typography.body2.fontSize,
    fontWeight: 500,
    textTransform: "none",
    px: 1.5,
    py: 0.5,
    minWidth: "auto",
    color: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? theme.palette.common.white
        : theme.palette.common.black,
  },
  "& .MuiTab-root.Mui-selected": {
    color: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? theme.palette.common.white
        : theme.palette.common.black,
  },
  "& .MuiTab-icon": {
    fontSize: "1.125rem",
    color: "inherit",
  },
  "& .MuiTabs-indicator": {
    height: 2,
  },
};

export interface SettingsPageTab<T extends string> {
  key: T;
  labelKey?: string;
  label?: ReactNode;
  icon?: ReactElement;
}

interface SettingsPageTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: SettingsPageTab<T>[];
  variant?: "primary" | "section";
}

export function SettingsPageTabs<T extends string>({
  value,
  onChange,
  tabs,
  variant = "primary",
}: SettingsPageTabsProps<T>) {
  const { t } = useTranslation();
  const isSection = variant === "section";

  return (
    <Tabs
      value={value}
      onChange={(_, next) => onChange(next as T)}
      variant={isSection ? "scrollable" : undefined}
      scrollButtons={isSection ? "auto" : undefined}
      sx={isSection ? settingsSectionTabsSx : settingsPageTabsSx}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.key}
          value={tab.key}
          icon={tab.icon}
          iconPosition={tab.icon ? "start" : undefined}
          label={
            tab.labelKey
              ? t(tab.labelKey as never)
              : (tab.label ?? tab.key)
          }
        />
      ))}
    </Tabs>
  );
}
