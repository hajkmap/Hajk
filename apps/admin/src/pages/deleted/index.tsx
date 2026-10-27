import { useMemo, useState } from "react";
import { Box, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import { SettingsPageTabs } from "../../components/settings-page-tabs";
import DeletedItemsList, {
  type DeletedItemsFilter,
} from "./components/deleted-items-list";
import { useDeletedItems } from "./use-deleted-items";

type DeletedTab = DeletedItemsFilter;

export default function DeletedItemsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DeletedTab>("all");
  const { counts } = useDeletedItems();

  const tabs = useMemo(
    () =>
      (
        [
          { key: "all" as const, labelKey: "deleted.tabs.all", count: counts.all },
          { key: "map" as const, labelKey: "common.maps", count: counts.map },
          {
            key: "group" as const,
            labelKey: "common.layerGroups",
            count: counts.group,
          },
          {
            key: "service" as const,
            labelKey: "common.services",
            count: counts.service,
          },
          {
            key: "layer" as const,
            labelKey: "deleted.tabs.layers",
            count: counts.layer,
          },
          {
            key: "theme" as const,
            labelKey: "common.themes",
            count: counts.theme,
          },
        ] as const
      ).map((tab) => {
        const selected = activeTab === tab.key;
        return {
          key: tab.key,
          label: (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span>{t(tab.labelKey)}</span>
              <Chip
                size="small"
                label={tab.count}
                sx={{
                  height: 20,
                  minWidth: 20,
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  bgcolor: selected ? "primary.light" : "action.hover",
                  color: selected ? "primary.dark" : "text.primary",
                  "& .MuiChip-label": {
                    px: 0.75,
                    py: 0,
                  },
                }}
              />
            </Box>
          ),
        };
      }),
    [activeTab, counts, t],
  );

  return (
    <Page title={t("deleted.title")}>
      <Box sx={{ width: "100%" }}>
        <SettingsPageTabs
          value={activeTab}
          onChange={setActiveTab}
          variant="section"
          tabs={tabs}
        />
        <DeletedItemsList filter={activeTab} />
      </Box>
    </Page>
  );
}
