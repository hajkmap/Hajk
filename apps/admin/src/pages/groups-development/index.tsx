import { useTranslation } from "react-i18next";

import Page from "../../layouts/root/components/page";
import GroupLayerTree from "./components/group-layer-tree";

export default function GroupsDevelopmentPage() {
  const { t } = useTranslation();

  return (
    <Page title={t("common.groupsDevelopment")}>
      <GroupLayerTree />
    </Page>
  );
}
