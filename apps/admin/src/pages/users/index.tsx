import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";

export default function UsersPage() {
  const { t } = useTranslation();

  return (
    <Page title={t("common.users")}>
      <p>{t("common.users")}</p>
    </Page>
  );
}
