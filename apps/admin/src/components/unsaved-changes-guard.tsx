import { useCallback } from "react";
import { useBlocker, useBeforeUnload } from "react-router";
import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import DialogWrapper from "./flexible-dialog";

interface UnsavedChangesGuardProps {
  when: boolean;
}

export default function UnsavedChangesGuard({ when }: UnsavedChangesGuardProps) {
  const { t } = useTranslation();
  const shouldBlockNavigation = useCallback(
    ({
      currentLocation,
      nextLocation,
    }: {
      currentLocation: { pathname: string };
      nextLocation: { pathname: string };
    }) => {
      if (!when) return false;
      return currentLocation.pathname !== nextLocation.pathname;
    },
    [when],
  );
  const blocker = useBlocker(shouldBlockNavigation);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (when) {
          event.preventDefault();
        }
      },
      [when],
    ),
  );

  const isBlocked = blocker.state === "blocked";

  return (
    <DialogWrapper
      open={isBlocked}
      title={t("common.unsavedChangesTitle")}
      onClose={() => blocker.reset?.()}
      actions={
        <>
          <Button variant="contained" onClick={() => blocker.reset?.()}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => blocker.proceed?.()}
          >
            {t("common.unsavedChangesLeave")}
          </Button>
        </>
      }
    >
      <Typography>{t("common.unsavedChangesMessage")}</Typography>
    </DialogWrapper>
  );
}
