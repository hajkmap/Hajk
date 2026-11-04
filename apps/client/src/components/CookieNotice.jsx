import React from "react";
import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogContentText,
  FormControlLabel,
  FormGroup,
  Link,
} from "@mui/material";
import BaseDialog from "./Dialog/BaseDialog";
import {
  functionalOk,
  setLevel,
  shouldShowNotice,
  thirdPartyOk,
} from "../models/Cookie";
import { useTranslation } from "react-i18next";
import { configText } from "src/i18n";

// Default url if none is supplied from the configuration. The default message is cookieNotice.message.
const DEFAULT_URL =
  "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/";

// We're using several labeled checkboxes, let's create a component so that we keep DRY.
const LabeledCheckbox = ({ checked, disabled, label, onChange }) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          color="primary"
          disabled={disabled ?? false}
          checked={checked}
          onChange={onChange}
        />
      }
      label={label}
    />
  );
};

function CookieNotice({ globalObserver, appModel }) {
  const { t } = useTranslation();
  const { config } = appModel;

  // We should initialize the dialog:s open-state to whatever the manager states.
  const [open, setOpen] = React.useState(shouldShowNotice());
  const [functionalChecked, setFunctionalChecked] =
    React.useState(functionalOk);
  const [thirdPartChecked, setThirdPartChecked] = React.useState(thirdPartyOk);

  const defaultCookieNoticeMessage = configText(
    "cookieNotice.message",
    config?.mapConfig?.map?.defaultCookieNoticeMessage
  );
  const defaultCookieNoticeUrl =
    config?.mapConfig?.map?.defaultCookieNoticeUrl || DEFAULT_URL;
  const showThirdPartCheckbox =
    config?.mapConfig?.map?.cookieUse3dPart ?? false;

  // We're subscribing to the globalObserver-events in an useEffect so that we can
  // make sure to clean up subscriptions on unMount. (The return-statement of useEffect).
  React.useEffect(() => {
    // An event that allows other components to show the cookie-notice so that
    // the user can re-think their decision...
    globalObserver.subscribe("core.showCookieBanner", () => {
      setOpen(true);
    });
    return () => {
      globalObserver.unsubscribe("core.showCookieBanner");
    };
  }, [globalObserver]);

  // Handler for when the user clicks "Allow selected", i.e. we should
  // check which boxes are ticked, and set the cookie-level accordingly.
  const handleAllowSelectedClick = React.useCallback(() => {
    // Required cookies are selected "automatically", so if they clicked
    // "Allow selected" they have at least accepted that (cookie-level 1).
    let cookieLevel = 1;
    // If the checkbox for functional-cookies is checked we bump the cookie-level.
    if (functionalChecked) {
      cookieLevel = cookieLevel | 2;
    }
    // If the checkbox for third-part-cookies is checked we bump the cookie-level.
    if (thirdPartChecked) {
      cookieLevel = cookieLevel | 4;
    }
    // Then we'll set the cookie-level in the manager.
    setLevel(cookieLevel);
    // Make sure to close the dialog when the user has made the choice.
    setOpen(false);
  }, [functionalChecked, thirdPartChecked]);

  // Handler for when the user clicks "Allow all", i.e. we should
  // ignore which boxes are ticked, and set the cookie-level to allow all.
  const handleAllowAllClick = React.useCallback(() => {
    // IF the user accepts all they are at least accepting required- and
    // functional-cookies. (Cookie-level 3).
    let cookieLevel = 3;
    // Set functional checked in case of revisit to cookie notice.
    setFunctionalChecked(true);
    // If we are showing the option for third-part-cookies, they are obviously
    // accepting that as well.
    if (showThirdPartCheckbox) {
      cookieLevel = cookieLevel | 4;
      // Set thirdPartChecked in case of revisit to cookie notice.
      setThirdPartChecked(true);
    }
    // Then we'll set the cookie-level in the manager.
    setLevel(cookieLevel);
    // Make sure to close the dialog when the user has made the choice.
    setOpen(false);
  }, [showThirdPartCheckbox]);

  return (
    <BaseDialog
      slotProps={{
        paper: {
          sx: (theme) => ({
            width: {
              // 16px = theme.spacing(2)
              xs: `calc(100% - ${theme.spacing(2)})`,
              // 32px = theme.spacing(4)
              sm: `calc(100% - ${theme.spacing(4)})`,
            },
            maxWidth: "md",
          }),
        },
      }}
      sx={{ zIndex: "9999" }}
      open={open}
      keepMounted
      aria-describedby="cookie-dialog-content-text"
    >
      <DialogContent>
        <DialogContentText
          sx={{ color: "text.primary" }}
          id="cookie-dialog-content-text"
        >
          {`${defaultCookieNoticeMessage} `}
          <Link
            href={defaultCookieNoticeUrl}
            underline="always"
            rel="noreferrer"
            target="_blank"
          >
            {t("cookieNotice.moreInfo")}
          </Link>
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <FormGroup
          row={true}
          sx={(theme) => ({
            // For some weird reason, the last checkbox is not getting the correct margin-right on mobile. And the only way to fix it is to use a media query and forced css.
            [theme.breakpoints.down("sm")]: {
              ".MuiFormControlLabel-root:last-child": { mr: 0 },
            },
          })}
        >
          <LabeledCheckbox
            disabled={true}
            checked={true}
            label={t("cookieNotice.necessary")}
          />
          <LabeledCheckbox
            onChange={(event) => {
              setFunctionalChecked(event.target.checked);
            }}
            checked={functionalChecked}
            label={t("cookieNotice.functional")}
          />
          {showThirdPartCheckbox && (
            <LabeledCheckbox
              onChange={(event) => {
                setThirdPartChecked(event.target.checked);
              }}
              checked={thirdPartChecked}
              label={t("cookieNotice.thirdParty")}
            />
          )}
        </FormGroup>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            pt: 1,
            pb: 2,
            "&&": { ml: 0 },
          }}
        >
          <Button
            color="primary"
            variant="contained"
            onClick={handleAllowSelectedClick}
          >
            {t("cookieNotice.allowSelected")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={handleAllowAllClick}
            sx={{ mr: { sm: 2 } }}
          >
            {t("cookieNotice.allowAll")}
          </Button>
        </Box>
      </DialogActions>
    </BaseDialog>
  );
}

export default CookieNotice;
