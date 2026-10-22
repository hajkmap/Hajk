import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import { SettingsPageTabs } from "../../components/settings-page-tabs";
import DeletedServicesList from "./components/deleted-services-list";
import DeletedLayersList from "./components/deleted-layers-list";
import DeletedThemesList from "./components/deleted-themes-list";

type DeletedTab =
  | "all"
  | "maps"
  | "groups"
  | "services"
  | "layers"
  | "tools"
  | "themes";

const DELETED_TABS: { key: DeletedTab; labelKey: string }[] = [
  { key: "all", labelKey: "deleted.tabs.all" },
  { key: "maps", labelKey: "common.maps" },
  { key: "groups", labelKey: "common.layerGroups" },
  { key: "services", labelKey: "common.services" },
  { key: "layers", labelKey: "deleted.tabs.layers" },
  { key: "tools", labelKey: "common.tools" },
  { key: "themes", labelKey: "common.themes" },
];

export default function DeletedItemsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DeletedTab>("all");
  const showServices = activeTab === "all" || activeTab === "services";
  const showLayers = activeTab === "all" || activeTab === "layers";
  const showThemes = activeTab === "all" || activeTab === "themes";
  const showEmpty = !showServices && !showLayers && !showThemes;

  return (
    <Page title={t("deleted.title")}>
      <Box sx={{ width: "100%" }}>
        <SettingsPageTabs
          value={activeTab}
          onChange={setActiveTab}
          variant="section"
          tabs={DELETED_TABS}
        />

        {showServices ? <DeletedServicesList /> : null}
        {showLayers ? <DeletedLayersList /> : null}
        {showThemes ? <DeletedThemesList /> : null}
        {showEmpty ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">{t("deleted.empty")}</Typography>
          </Box>
        ) : null}
      </Box>
    </Page>
  );
}
