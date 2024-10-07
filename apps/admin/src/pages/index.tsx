import { useTranslation } from "react-i18next";
import Page from "../layouts/root/components/page";

export default function IndexPage() {
  const { t } = useTranslation();
  return (
    <Page title={t("common.home")}>
      <p>Your home is where you live. Where you live is where your home is.</p>
    </Page>
  );
}
