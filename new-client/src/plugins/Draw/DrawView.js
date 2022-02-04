import React from "react";
import { createPortal } from "react-dom";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import NativeSelect from "@mui/material/NativeSelect";
import FormControl from "@mui/material/FormControl";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import { withSnackbar } from "notistack";
import Dialog from "../../components/Dialog/Dialog";
import Symbology from "./components/Symbology.js";

// The css-file is only targeting the ol-draw-interaction, and styles the tooltip.
// TODO: Remove?
import "./draw.css";

const StyledFormControl = styled(FormControl)(() => ({
  width: "100%",
}));

const Row = styled("div")(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(1),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
}));

class DrawView extends React.PureComponent {
  state = {
    shape: "LineString",
    drawMethod: "add",
    displayText: false,
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.globalObserver;
    this.snackbarKey = null;
    this.localObserver.subscribe("dialog", (feature) => {
      this.setState({
        feature: feature,
        dialog: true,
        dialogPrompt: true,
        dialogText: "",
        dialogButtonText: "OK",
        dialogAbortText: "Avbryt",
        dialogCloseCallback: this.onCloseTextDialog,
        dialogAbortCallback: this.onAbortTextDialog,
      });
    });
    this.addMapDropListeners();
  }

  addMapDropListeners = () => {
    const mapDiv = document.getElementById("map");
    ["drop", "dragover", "dragend", "dragleave", "dragenter"].forEach(
      (eventName) => {
        mapDiv.addEventListener(
          eventName,
          this.preventDefaultDropBehavior,
          false
        );
      }
    );
    mapDiv.addEventListener("dragenter", this.handleDragEnter, false);
    mapDiv.addEventListener("drop", this.handleDrop, false);
  };

  handleDragEnter = (e) => {
    this.snackbarKey = this.props.enqueueSnackbar(
      "Släpp en KML-fil i kartan för att importera!",
      { preventDuplicate: true }
    );
  };

  handleDrop = (e) => {
    try {
      const file = e.dataTransfer.files[0];
      if (file) {
        const fileType = file.type ? file.type : file.name.split(".").pop();
        //Not sure about filetype for kml... Qgis- and Hajk-generated kml:s does not contain any information about type.
        //The application/vnd... is a guess.
        if (
          fileType === "kml" ||
          fileType === "application/vnd.google-earth.kml+xml"
        ) {
          this.globalObserver.publish("draw.showWindow", {
            hideOtherPlugins: false,
          });
          this.addDroppedKmlToMap(file);
        }
      }
    } catch (error) {
      this.props.enqueueSnackbar("KML-filen kunde inte importeras.", {
        variant: "error",
      });
      console.error(`Error importing KML-file... ${error}`);
    }
  };

  addDroppedKmlToMap = (file) => {
    const { model } = this.props;
    const reader = new FileReader();

    reader.onload = () => {
      model.import(reader.result, (error) => {
        this.handleImportError(error);
      });
      this.props.closeSnackbar(this.snackbarKey);
      this.snackbarKey = null;
    };

    reader.readAsText(file);
  };

  handleImportError = (error) => {
    if (error === "no-features-found") {
      this.props.enqueueSnackbar("Inga ritobjekt hittades i KML-filen.", {
        variant: "warning",
      });
    } else {
      throw error;
    }
  };

  preventDefaultDropBehavior = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  handleChange = (name) => (event) => {
    this.setState({ [name]: event.target.value });
    if (name === "shape") {
      this.props.model.setType(event.target.value);
    }
    if (name === "drawMethod") {
      this.props.model.setDrawMethod(event.target.value);
    }
  };

  onAbortTextDialog = () => {
    this.setState({
      dialog: false,
    });
  };

  onCloseTextDialog = (text) => {
    this.props.model.openDialog(false);

    const { feature } = this.state;
    feature.set("type", "Text");
    feature.set("text", text);
    feature.setStyle(this.props.model.getStyle(feature));
    this.setState({
      dialog: false,
    });
    this.props.model.redraw();
  };

  renderDialog() {
    if (this.state.dialog) {
      this.props.model.openDialog(true);

      return createPortal(
        <Dialog
          options={{
            text: this.state.dialogText,
            prompt: this.state.dialogPrompt,
            headerText: this.state.dialogHeaderText || "Ange text",
            buttonText: this.state.dialogButtonText || "OK",
            abortText: this.state.dialogAbortText,
          }}
          open={this.state.dialog}
          onClose={this.state.dialogCloseCallback}
          onAbort={this.state.dialogAbortCallback}
        />,
        document.getElementById("map")
      );
    } else {
      return null;
    }
  }

  renderForm() {
    const { drawMethod } = this.state;

    if (drawMethod === "add") {
      return (
        <>
          <Row>
            <StyledFormControl>
              <InputLabel variant="standard" htmlFor="shape-native-helper">
                Typ av ritobjekt
              </InputLabel>
              <NativeSelect
                value={this.state.shape}
                onChange={this.handleChange("shape")}
                input={<Input name="shape" id="shape-native-helper" />}
              >
                <option value="LineString">Linje</option>
                <option value="Text">Text</option>
                <option value="Polygon">Yta</option>
                <option value="Square">Rektangel</option>
                <option value="Circle">Cirkel</option>
                <option value="Point">Punkt</option>
              </NativeSelect>
            </StyledFormControl>
          </Row>
          <StyledDivider>Ritmanér</StyledDivider>
          <Row>
            <Symbology type={this.state.shape} model={this.props.model} />
          </Row>
        </>
      );
    }

    if (drawMethod === "edit") {
      return (
        <>
          <Typography>
            Klicka på ett ritobjekt i kartan som du vill editera. Du kan editera
            dina egna ritobjekt. För att editera andra objekt använd
            editeraverktyget.
          </Typography>
        </>
      );
    }

    if (drawMethod === "remove") {
      return (
        <>
          <Typography>
            Klicka på ett ritobjekt i kartan som du vill ta bort. Du kan ta bort
            dina egna ritobjekt. För att ta bort andra objekt använd
            editeraverktyget.
          </Typography>
        </>
      );
    }

    if (drawMethod === "move") {
      return (
        <>
          <Typography>
            Klicka på det ritobjekt i kartan som du vill flytta för att aktivera
            flyttläge, dra därefter objektet till ny position. Du kan flytta
            dina egna ritobjekt. För att flytta andra objekt använd
            editeraverktyget.
          </Typography>
        </>
      );
    }

    if (drawMethod === "import") {
      return (
        <>
          <div>
            <Button sx={{ width: "100%" }} onClick={this.openUploadDialog}>
              <FolderOpenIcon />
              &nbsp; Importera ritobjekt
            </Button>
          </div>
          <div>
            <Button sx={{ width: "100%" }} onClick={this.props.model.export}>
              <SaveAltIcon />
              &nbsp; Exportera ritobjekt
            </Button>
          </div>
        </>
      );
    }
  }

  openUploadDialog = (e) => {
    this.setState({
      dialog: true,
      dialogPrompt: false,
      dialogHeaderText: "Ladda upp innehåll",
      dialogText: this.renderImport(),
      dialogButtonText: "Avbryt",
      dialogCloseCallback: this.onCloseUploadDialog,
    });
  };

  onCloseUploadDialog = () => {
    this.setState({
      dialog: false,
    });
    return;
  };

  renderImport() {
    return (
      <div>
        <Typography>Välj KML-fil att importera:</Typography>
        <Row>
          <input
            type="file"
            name="files[]"
            accept=".kml"
            multiple={false}
            id="file-uploader"
          />
        </Row>
        <Row>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            value="Ladda upp"
            onClick={() => {
              var fileUploader = document.getElementById("file-uploader");
              var file = fileUploader.files[0];
              var reader = new FileReader();
              reader.onload = () => {
                this.onCloseUploadDialog();
                this.props.model.import(reader.result, (error) => {
                  try {
                    this.handleImportError(error);
                  } catch (error) {
                    console.error(`Error importing KML-file... ${error}`);
                  }
                });
              };
              if (file) {
                reader.readAsText(file);
              }
            }}
          >
            Ladda upp
          </Button>
        </Row>
      </div>
    );
  }

  render() {
    return (
      <>
        <Row>
          <Row>
            <Button
              variant="contained"
              sx={{ width: "100%" }}
              onClick={this.props.model.clear}
            >
              <DeleteIcon />
              Ta bort alla ritobjekt
            </Button>
          </Row>
          <Row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.displayText}
                  onChange={() => {
                    this.setState({
                      displayText: !this.state.displayText,
                    });
                    this.model.displayText = !this.model.displayText;
                    this.localObserver.publish("update");
                  }}
                  color="primary"
                />
              }
              label="Visa mått på ritobjekt"
            />
          </Row>
          <StyledDivider>Inställningar</StyledDivider>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="drawMethod-native-helper">
              Aktivitet
            </InputLabel>
            <NativeSelect
              value={this.state.drawMethod}
              onChange={this.handleChange("drawMethod")}
              input={<Input name="drawMethod" id="drawMethod-native-helper" />}
            >
              <option value="abort">Ingen</option>
              <option value="add">Lägg till objekt</option>
              <option value="remove">Ta bort objekt</option>
              <option value="edit">Editera objekt</option>
              <option value="move">Flytta objekt</option>
              <option value="import">Importera/Exportera</option>
            </NativeSelect>
          </StyledFormControl>
        </Row>
        {this.renderForm()}
        {this.renderDialog()}
      </>
    );
  }
}

export default withSnackbar(DrawView);
