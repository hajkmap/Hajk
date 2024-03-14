import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";

function InfoDialog({ localObserver }) {
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const handleClose = () => {
    setClearDialogVisible(false);
  };

  const handleOpen = () => {
    setClearDialogVisible(true);
  };

  React.useEffect(() => {
    localObserver.subscribe("showInfoDialog", handleOpen);

    return () => {
      localObserver.unsubscribe("showInfoDialog", handleOpen);
    };
  }, [localObserver]);

  return (
    <Dialog
      open={clearDialogVisible}
      onClose={handleClose}
      scroll="body"
      onMouseDown={(e) => {
        // Needed to disabled unwanted dragging of the underlying Window component
        // and allow text selection in Dialog.
        e.stopPropagation();
      }}
    >
      <DialogTitle>Hjälp</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1">Allmänt</Typography>
        <DialogContentText>
          Syftet med det här verktyget är att underlätta flödet vid arbete som
          rör fastighetsfrågor.
        </DialogContentText>
      </DialogContent>
      <DialogContent>
        <Typography variant="subtitle1">Huvudknapp</Typography>
        <DialogContentText>
          Överst i verktyget finns en knapp, så kallad <i>Huvudknapp</i>. Med
          hjälp av den kan du aktivera ett läge som låter dig klicka i kartan
          för att välja fastighet av intresse. <br />
          <br />
          Efter ett genomfört klick ändras denna knapp till en rensa-knapp. Du
          klickar på den för att nollställa verktyget och välja en annan
          fastighet.
        </DialogContentText>
      </DialogContent>
      <DialogContent>
        <Typography variant="subtitle1">Snabblager</Typography>
        <DialogContentText>
          Direkt under Huvudknappen hittar du tre snabbknappar. Där hittar
          snabbval för att synliggöra lagren Byggnader, Fastighetsinformation
          samt Detaljplaner.
        </DialogContentText>
      </DialogContent>
      <DialogContent>
        <Typography variant="subtitle1">Listvy</Typography>
        <DialogContentText>
          När du klickar i kartan görs en sökning mot tjänsterna.
          <b>
            Sökningen tittar på fastigheten som ditt klick inträffade på och
            undersöker vilka lager som berör fastigheten.
          </b>
          <br />
          <br />
          Resultaten presenteras i en listvy. Om du klickar i närheten av en
          fastighetsgräns kan det hända att du får resultatet för flera
          fastigheter. Om det finns flera val, tänk då på att notera vilken
          fastighet du valt att granska mot i listan.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          Stäng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InfoDialog;
