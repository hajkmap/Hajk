import React, { useState } from "react";
import { object } from "prop-types";
import {
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
} from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Slide from "@material-ui/core/Slide";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles((theme) => ({
  dialogContainer: {
    "& .MuiDialog-container": {
      justifyContent: "flex-center",
      alignItems: "flex-end",
    },
  },
  dialogText: {
    color: theme.palette.text.primary,
    paddingBottom: theme.spacing(2),
  },
  textButton: {
    marginLeft: theme.spacing(1),
  },
  link: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
}));

CookieNotice.propTypes = {
  globalObserver: object.isRequired,
  appModel: object.isRequired,
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 *  *
 * @export
 * @param {*} props
 * @returns React.Component
 */
function CookieNotice({ globalObserver, appModel }) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [checkBoxFunctional, setCheckBoxFunctional] = useState(false);
  const [checkBox3rdPart, setCheckBox3rdPart] = useState(false);

  const defaultCookieNoticeMessage =
    appModel.config?.mapConfig?.map?.defaultCookieNoticeMessage ??
    "Vi använder nödvändiga kakor (cookies) för att webbplatsen ska fungera på ett bra sätt för dig. Vi använder också funktionella kakor för att ge dig bästa möjliga funktion om du godkänner användningen av dessa.";
  const defaultCookieNoticeUrl =
    appModel.config?.mapConfig?.map?.defaultCookieNoticeUrl ??
    "https://pts.se/sv/bransch/regler/lagar/lag-om-elektronisk-kommunikation/kakor-cookies/";

  const use3dPartCookies =
    appModel.config?.mapConfig?.map?.cookieUse3dPart ?? false;
  let jsxUse3dPartCheckbox = null;
  if (use3dPartCookies) {
    jsxUse3dPartCheckbox = (
      <>
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              checked={checkBox3rdPart}
              onChange={(event) => {
                setCheckBox3rdPart(event.target.checked);
              }}
            />
          }
          label={"3:e Part"}
        />
      </>
    );
  }

  const handleClose = () => {
    //setOpen(false); // Uncomment this to convert this dialog to a "modeless" dialog
  };

  if (appModel.cookieManager.showCookieNotice() === true) {
    globalObserver.subscribe("core.appLoaded", () => {
      setOpen(true);
    });
  }

  globalObserver.subscribe("core.showCookieBanner", () => {
    setOpen(true);
  });

  return (
    <div>
      <Dialog
        fullWidth={true}
        maxWidth={"md"}
        className={classes.dialogContainer}
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="cookie-dialog-content-text"
      >
        <DialogContent>
          <DialogContentText
            className={classes.dialogText}
            id="cookie-dialog-content-text"
          >
            {defaultCookieNoticeMessage}

            <Link
              href={defaultCookieNoticeUrl}
              className={classes.link}
              underline="always"
              rel="noreferrer"
              target="_blank"
            >
              {"Mer information om kakor"}
            </Link>
          </DialogContentText>
          <Grid></Grid>
          <Grid container direction="row-reverse">
            <Grid>
              <Button
                color="primary"
                variant="contained"
                className={classes.textButton}
                onClick={() => {
                  let cookieLevel = 1; // Required
                  if (checkBoxFunctional) {
                    cookieLevel = cookieLevel | 2; // Functional
                  }
                  if (checkBox3rdPart) {
                    cookieLevel = cookieLevel | 4; // ThirdParty
                  }
                  appModel.cookieManager.setCookieLevels(cookieLevel);
                  setOpen(false);
                }}
              >
                {"Tillåt valda"}
              </Button>
              <Button
                color="primary"
                variant="contained"
                className={classes.textButton}
                onClick={() => {
                  let cookieLevel = 3; // Required AND Functional
                  if (use3dPartCookies) {
                    cookieLevel = cookieLevel | 4;
                  }
                  appModel.cookieManager.setCookieLevels(cookieLevel);
                  setOpen(false);
                }}
              >
                {"Tillåt Alla"}
              </Button>
            </Grid>
            <Grid>
              <FormControlLabel
                control={
                  <Checkbox color="primary" checked={true} disabled={true} />
                }
                label={"Nödvändiga"}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={checkBoxFunctional}
                    onChange={(event) => {
                      setCheckBoxFunctional(event.target.checked);
                    }}
                  />
                }
                label={"Funktionella"}
              />
              {jsxUse3dPartCheckbox}
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CookieNotice;
