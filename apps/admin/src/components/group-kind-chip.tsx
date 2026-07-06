import React from "react";
import { Chip, Tooltip } from "@mui/material";
import TitleIcon from "@mui/icons-material/Title";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { useTranslation } from "react-i18next";

interface GroupKindChipProps {
  /** Map placement toggled — legacy "Toggla alla-knapp". */
  toggleAllEnabled: boolean;
}

export default function GroupKindChip({
  toggleAllEnabled,
}: GroupKindChipProps) {
  const { t } = useTranslation();

  return (
    <Tooltip
      title={
        toggleAllEnabled
          ? t("groups.composition.activatableHelp")
          : t("groups.composition.headerGroupHelp")
      }
    >
      <Chip
        size="small"
        color={toggleAllEnabled ? "primary" : "default"}
        variant={toggleAllEnabled ? "filled" : "outlined"}
        icon={toggleAllEnabled ? <ToggleOnIcon /> : <TitleIcon />}
        label={
          toggleAllEnabled
            ? t("groups.composition.activatable")
            : t("groups.composition.headerGroup")
        }
      />
    </Tooltip>
  );
}
