import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";

export default function UserRolesPage() {
  const { t } = useTranslation();

  return (
    <Page title={t("common.userRoles")}>
      <p>{t("common.userRoles")}</p>
    </Page>
  );
}
