import React from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  FormControlLabel,
  FormGroup,
  Link,
  Slide,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { setLevel, shouldShowNotice } from "../models/Cookie";

// Default settings for the cookie-notice text and url if none is supplied from the configuration.
const DEFAULT_MESSAGE =
  "Vi använder nödvändiga kakor (cookies) för att webbplatsen ska fungera på ett bra sätt för dig. Vi använder också funktionella kakor för att ge dig bästa möjliga funktion om du godkänner användningen av dessa.";
const DEFAULT_URL =
  "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    "& .MuiDialog-container": {
      alignItems: "flex-end",
      padding: "16px 20px",
    },
  },
}));

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

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function CookieNotice({ globalObserver, appModel }) {
  const { config } = appModel;

  // We should initialize the dialog:s open-state to whatever the manager states.
  const [open, setOpen] = React.useState(shouldShowNotice());
  const [functionalChecked, setFunctionalChecked] = React.useState(false);
  const [thirdPartChecked, setThirdPartChecked] = React.useState(false);

  const defaultCookieNoticeMessage =
    config?.mapConfig?.map?.defaultCookieNoticeMessage || DEFAULT_MESSAGE;
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
    <StyledDialog
      fullWidth={true}
      maxWidth={"md"}
      open={open}
      TransitionComponent={Transition}
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
            {"Mer information om kakor"}
          </Link>
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <FormGroup
          sx={{
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <LabeledCheckbox
            disabled={true}
            checked={true}
            label={"Nödvändiga"}
          />
          <LabeledCheckbox
            onChange={(event) => {
              setFunctionalChecked(event.target.checked);
            }}
            checked={functionalChecked}
            label={"Funktionella"}
          />
          {showThirdPartCheckbox && (
            <LabeledCheckbox
              onChange={(event) => {
                setThirdPartChecked(event.target.checked);
              }}
              checked={thirdPartChecked}
              label={"Tredjepart"}
            />
          )}
        </FormGroup>
        <Button
          color="primary"
          variant="contained"
          onClick={handleAllowSelectedClick}
        >
          {"Tillåt valda"}
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={handleAllowAllClick}
          sx={{ margin: [1, 1] }}
        >
          {"Tillåt Alla"}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default CookieNotice;
