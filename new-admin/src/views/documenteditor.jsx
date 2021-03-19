import React from "react";
import { Component } from "react";
import DocumentTextEditor from "./components/DocumentTextEditor.jsx";
import DocumentChapter from "./components/DocumentChapter.jsx";
import AddKeyword from "./components/AddKeyword.jsx";
import AddGeoObject from "./components/AddGeoObject.jsx";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/Done";
import RemoveIcon from "@material-ui/icons/Remove";
import SaveIcon from "@material-ui/icons/SaveSharp";

import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";

import { withStyles } from "@material-ui/core/styles";
import { Typography, Box } from "@material-ui/core";
import { red, green, blue } from "@material-ui/core/colors";
import Chip from "@material-ui/core/Chip";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormGroup from "@material-ui/core/FormGroup";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import TocIcon from "@material-ui/icons/Toc";
import NativeSelect from "@material-ui/core/NativeSelect";
import AddBoxIcon from "@material-ui/icons/AddBox";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import FormHelperText from "@material-ui/core/FormHelperText";

import { Grid } from "@material-ui/core";

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const styles = (theme) => ({
  container: {
    width: 1500,
    display: "flex",
    flexWrap: "wrap",
    paddingLeft: 20,
  },
  root: {
    width: "80%",
  },
  row: {
    width: "100%",
    minHeight: 28,
    margin: 8,
  },
  gridItemContainer: {
    marginTop: "16px",
  },
  addHeadChapterButton: {
    marginTop: "8px",
    marginBottom: "8px",
  },

  gridItem: {
    marginRight: "8px",
  },

  chapterPlacementControls: {
    position: "absolute",
    top: "4px",
    right: "4px",
  },

  editorWrapper: {
    width: "100%",
  },

  chapterWrapper: {
    position: "relative",
    padding: "8px",
  },

  chapterWrapperBoarder: {
    borderTop: "2px solid #BFBFBF",
  },

  column: {
    width: "50%",
  },
  columnLeft: {
    float: "left",
    textAlign: "left",
  },
  columnRight: {
    float: "right",
    textAlign: "left",
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
});

class Chapter {
  constructor(settings) {
    settings = settings || {};
    this.header = settings.header || "";
    this.headerIdentifier = settings.headerIdentifier || settings.header;
    this.html = settings.html || "";
    this.keywords = settings.keywords || [];
    this.geoObjects = settings.geoObjects || [];
    this.chapters = [];
  }
}

class DocumentEditor extends Component {
  constructor() {
    super();
    this.state = {
      showModal: false,
      data: undefined,
      newChapterName: "",
      newDocumentName: "",
      newDocumentMap: "",
      newHeaderIdentifier: "",
      documents: [],
      keywords: [],
      geoObjects: [],
      imageList: undefined,
      newTableOfContentsExpanded: undefined,
      newTableOfContentsActive: undefined,
      newTableOfContentsLevels: undefined,
      newTableOfContentsTitle: undefined,
      tableOfContentsModal: false,
      tableOfContents: {},
      editTitle: false,
    };
    this.editors = [];
    this.documentTitle = React.createRef();
  }

  load(document) {
    this.props.model.loadDocuments((documents) => {
      if (documents.length > 0) {
        this.props.model.load(document || documents[0], (data) => {
          this.setState(
            {
              data: data,
              documents: documents,
              documentTitle: data.title,
              selectedDocument: document || "",
              tableOfContents: {
                expanded: data.tableOfContents
                  ? data.tableOfContents.expanded
                  : true,
                active: data.tableOfContents
                  ? data.tableOfContents.active
                  : true,
                chapterLevelsToShow: data.tableOfContents
                  ? data.tableOfContents.chapterLevelsToShow
                  : 100,
                title: data.tableOfContents
                  ? data.tableOfContents.title
                  : "Innehållsförteckning",
              },
              newTableOfContentsExpanded: data.tableOfContents
                ? data.tableOfContents.expanded
                : true,
              newTableOfContentsActive: data.tableOfContents
                ? data.tableOfContents.active
                : true,
              newTableOfContentsLevels: data.tableOfContents
                ? data.tableOfContents.chapterLevelsToShow
                : 100,
              newTableOfContentsTitle: data.tableOfContents
                ? data.tableOfContents.title
                : "Innehållsförteckning",
            },
            () => {
              this.props.model.loadMaps((maps) => {
                this.setState({
                  maps: maps,
                  map: data.map,
                  newDocumentMap: maps[0],
                });
              });
            }
          );
        });
      } else {
        this.props.model.loadMaps((maps) => {
          this.setState({
            maps: maps,
            newDocumentMap: maps[0],
          });
        });
      }
    });
  }

  loadImageList() {
    this.props.model.listImages((data) => {
      this.setState({
        imageList: data,
      });
    });
  }

  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.load();
    this.loadImageList();
  }

  save() {
    this.props.model.save(
      this.state.selectedDocument,
      this.state.data,
      (result) => {
        if (result === "File saved") {
          result = "Filen sparades utan problem.";
        }
        this.setState({
          showModal: true,
          modalTitle: result,
          modalContent: "",
          showAbortButton: false,
          modalConfirmCallback: () => {},
        });
      }
    );
  }

  delete() {
    this.setState({
      showModal: true,
      modalContent: (
        <div>
          Hela dokumentet kommer att raderas, detta kan inte ångras. Vill du
          fortsätta?
        </div>
      ),
      showAbortButton: true,
      modalConfirmCallback: () => {
        this.props.model.delete(this.state.selectedDocument, (result) => {
          this.load();
        });
      },
    });
  }

  addChapter(title, titleID) {
    this.state.data.chapters.push(
      new Chapter({
        header: title,
        headerIdentifier: titleID,
      })
    );
    this.setState({
      data: this.state.data,
    });
  }

  removeChapter(parentChapters, index) {
    this.setState({
      showModal: true,
      modalTitle: "Ta bort kapitel",
      modalContent:
        "Detta kapitel och dess underkapitel kommer att tas bort, det går inte att ångra ditt val. Vill du verkställa ändringen?",
      showAbortButton: true,
      modalConfirmCallback: () => {
        parentChapters.splice(index, 1);
        this.forceUpdate();
      },
    });
  }

  hideModal() {
    this.setState({
      showModal: false,
      modalStyle: {},
      okButtonText: "OK",
      modalConfirmCallback: () => {},
    });
  }

  renderToc(currentChapter, chapters, parentChapters, index) {
    var renderChapters = (subchapters) => {
      var renderableChapters = subchapters ? subchapters : chapters;
      return renderableChapters.map((chapter, i) => {
        if (chapter !== currentChapter) {
          return (
            <div key={i}>
              <Button
                style={{ cursor: "pointer" }}
                onClick={() => {
                  chapter.chapters.push(currentChapter);
                  parentChapters.splice(index, 1);
                  if (this.state.modalConfirmCallback) {
                    this.state.modalConfirmCallback();
                  }
                }}
              >
                {chapter.header}
              </Button>
              {chapter.chapters.length > 0
                ? renderChapters(chapter.chapters)
                : null}
            </div>
          );
        } else {
          return null;
        }
      });
    };

    return (
      <div>
        <p>
          Flytta <b>{currentChapter.header}</b> till:{" "}
        </p>
        <div>
          <Button
            style={{ cursor: "pointer" }}
            onClick={() => {
              chapters.push(currentChapter);
              parentChapters.splice(index, 1);
              if (this.state.modalConfirmCallback) {
                this.state.modalConfirmCallback();
              }
            }}
          >
            Huvudkategori
          </Button>
          {renderChapters()}
        </div>
      </div>
    );
  }

  renderTocDialog(chapter, parentChapters, index) {
    this.setState({
      showModal: true,
      showAbortButton: true,
      modalContent: this.renderToc(
        chapter,
        this.state.data.chapters,
        parentChapters,
        index
      ),
      modalConfirmCallback: () => {
        this.hideModal();
      },
      modalStyle: {
        overlay: {},
        content: {
          left: "30px",
          top: "30px",
          right: "30px",
          bottom: "30px",
          width: "auto",
          margin: 0,
        },
      },
    });
  }

  renderNameInput() {
    setTimeout(() => {
      var i = document.getElementById("change-name");
      if (i) {
        i.focus();
      }
    }, 50);
    return (
      <>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Ange nytt namn"
          type="text"
          defaultValue={this.state.newChapterName}
          onChange={(e) => {
            this.setState({
              newChapterName: e.target.value,
            });
          }}
          fullWidth
        />
        <TextField
          margin="dense"
          id="name"
          label="Ange nytt ID"
          type="text"
          defaultValue={this.state.newHeaderIdentifier}
          onChange={(e) => {
            this.setState({
              newHeaderIdentifier: e.target.value,
            });
          }}
          fullWidth
        />
      </>
    );
  }

  renderChangeNameDialog(chapter) {
    this.setState(
      {
        newChapterName: chapter.header,
        newHeaderIdentifier: chapter.headerIdentifier,
      },
      () => {
        this.setState({
          showModal: true,
          showAbortButton: true,
          modalTitle: "Ändra titel",
          modalContent: this.renderNameInput(),
          modalConfirmCallback: () => {
            chapter.header = this.state.newChapterName;
            chapter.headerIdentifier = this.state.newHeaderIdentifier;
            this.hideModal();
          },
        });
      }
    );
  }

  moveChapter(direction, chapters, index) {
    var moveable = false,
      from = index,
      to = 0;

    if (direction === "up" && index !== 0) {
      to = index - 1;
      moveable = true;
    }
    if (direction === "down" && index < chapters.length - 1) {
      to = index + 1;
      moveable = true;
    }

    if (moveable) {
      chapters.splice(to, 0, chapters.splice(from, 1)[0]);
      this.forceUpdate();
    }
  }

  renderChapter(parentChapters, chapter, index, headChapter) {
    const { classes } = this.props;

    var arrowStyle = !!chapter.expanded
      ? "fa fa-chevron-up pointer"
      : "fa fa-chevron-down pointer";

    return (
      <Grid
        className={
          headChapter
            ? `${classes.chapterWrapper}`
            : `${classes.chapterWrapper} ${classes.chapterWrapperBoarder}`
        }
        container
        alignItems="center"
        key={Math.random() * 1e8}
      >
        <Box className={classes.chapterPlacementControls}>
          <Grid container>
            <Grid item>
              <Tooltip title="Flytta ned kapitel">
                <IconButton
                  size="small"
                  onClick={() => {
                    this.moveChapter("down", parentChapters, index);
                  }}
                >
                  <ArrowDownwardIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Flytta upp kapitel">
                <IconButton
                  size="small"
                  onClick={() => {
                    this.moveChapter("up", parentChapters, index);
                  }}
                >
                  <ArrowUpwardIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Öppna dialog för att kunna flytta kapitel till ett specifikt ställe">
                <IconButton
                  size="small"
                  onClick={() => {
                    this.renderTocDialog(chapter, parentChapters, index);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Öppna dialog för att kunna flytta kapitel till ett specifikt ställe">
                <IconButton
                  size="small"
                  onClick={() => {
                    chapter.expanded = !chapter.expanded;
                    this.forceUpdate();
                  }}
                >
                  <span className={arrowStyle} />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
        <Grid className={classes.gridItemContianer} container item>
          <Grid className={classes.gridItem}>
            <TextField
              required
              placeholder="Rubrik"
              helperText="Kapitelrubrik"
              defaultValue={chapter.header}
              onClick={() => {
                this.renderChangeNameDialog(chapter);
              }}
            />
          </Grid>
          <Grid className={classes.gridItem} item>
            <DocumentChapter
              onAddChapter={(title, titleID) => {
                chapter.chapters.push(
                  new Chapter({
                    header: title,
                    headerIdentifier: titleID,
                  })
                );
                this.forceUpdate();
              }}
            />
          </Grid>
          <Grid className={classes.gridItem} item>
            <ColorButtonRed
              variant="contained"
              className="btn btn-danger"
              onClick={() => {
                this.removeChapter(parentChapters, index);
              }}
              startIcon={<RemoveIcon />}
            >
              Ta bort
            </ColorButtonRed>
          </Grid>
        </Grid>
        <Grid xs={6} item container></Grid>

        <Grid
          alignItems="center"
          container
          item
          className={classes.gridItemContainer}
        >
          <Typography className={classes.gridItem}>Nyckelord</Typography>
          {chapter.keywords
            ? chapter.keywords.map((keyword, i) => (
                <Chip
                  key={i}
                  label={keyword}
                  onDelete={(i) => {
                    const index = chapter.keywords.indexOf(keyword);
                    if (index > -1) {
                      chapter.keywords.splice(index, 1);
                    }
                    this.setState({
                      keywords: chapter.keywords,
                    });
                  }}
                />
              ))
            : null}
          <Grid item>
            <AddKeyword
              onAddKeyword={(keyword) => {
                chapter.keywords.push(keyword);
                this.setState({
                  keywords: chapter.keywords,
                });
                this.forceUpdate();
              }}
            />
          </Grid>
        </Grid>
        <Grid alignItems="center" container item className={classes.gridItem}>
          <Typography className={classes.gridItem}>Geoobjekt</Typography>
          {chapter.geoObjects
            ? chapter.geoObjects.map((geoObject, i) => (
                <Chip
                  key={i}
                  label={geoObject}
                  onDelete={(i) => {
                    const index = chapter.geoObjects.indexOf(geoObject);
                    if (index > -1) {
                      chapter.geoObjects.splice(index, 1);
                    }
                    this.setState({
                      geoObjects: chapter.geoObjects,
                    });
                  }}
                />
              ))
            : null}
          <Grid item>
            <AddGeoObject
              onAddGeoObject={(geoObject) => {
                this.setState({
                  geoObjects: chapter.geoObjects,
                });
                chapter.geoObjects.push(geoObject);
                this.forceUpdate();
              }}
            />
          </Grid>
        </Grid>
        <Grid className={classes.editorWrapper} item>
          <DocumentTextEditor
            display={chapter.expanded}
            html={chapter.html}
            onUpdate={(html) => {
              chapter.html = html;
            }}
            imageList={this.state.imageList}
            documents={this.state.documents}
          />
        </Grid>

        <Grid
          className={classes.gridItemContainer}
          style={{
            paddingLeft: (index + 1) * 16,
          }}
          container
        >
          {chapter.expanded
            ? chapter.chapters.map((innerChapter, innerIndex) => {
                return this.renderChapter(
                  chapter.chapters,
                  innerChapter,
                  innerIndex,
                  false
                );
              })
            : null}
        </Grid>
      </Grid>
    );
  }

  renderData() {
    if (this.state.data) {
      return (
        <div>
          {this.state.data.chapters.map((chapter, index) =>
            this.renderChapter(this.state.data.chapters, chapter, index, true)
          )}
        </div>
      );
    }
  }

  renderMapName() {
    const { classes } = this.props;

    if (this.state.data) {
      return (
        <div className={classes.columnRight}>
          <Typography>
            Detta dokument tillhör kartan: <b>{this.state.data.map}</b>
          </Typography>
        </div>
      );
    }
  }

  renderModal() {
    return (
      <div>
        <Dialog
          open={this.state.showModal}
          onClose={() => this.hideModal()}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {this.state.modalTitle}
          </DialogTitle>
          <DialogContent>{this.state.modalContent}</DialogContent>
          <DialogActions>
            <Button onClick={() => this.hideModal()} color="primary">
              Avbryt
            </Button>
            <ColorButtonGreen
              variant="contained"
              className="btn"
              onClick={(e) => {
                if (this.state.modalConfirmCallback) {
                  this.state.modalConfirmCallback();
                }
                this.hideModal();
              }}
              startIcon={<DoneIcon />}
            >
              {this.state.okButtonText || "OK"}
            </ColorButtonGreen>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  renderMaps() {
    if (this.state.maps) {
      return this.state.maps.map((map, i) => {
        return (
          <MenuItem key={i} value={map}>
            {map}
          </MenuItem>
        );
      });
    } else {
      return null;
    }
  }

  renderDocuments() {
    return this.state.documents.map((document, i) => (
      <option key={i}>{document}</option>
    ));
  }

  validateNewDocumentName(value) {
    var valid = value === "" || /^[A-Za-z0-9_]+$/.test(value);
    return valid;
  }

  renderCreateForm() {
    setTimeout(() => {
      var i = document.getElementById("new-document-name");
      if (i) {
        i.focus();
      }
    }, 50);
    return (
      <>
        <TextField
          autoFocus
          margin="dense"
          id="new-document-name"
          label="Dokumentnamn"
          type="text"
          defaultValue={this.state.newDocumentName}
          onChange={(e) => {
            if (this.validateNewDocumentName(e.target.value)) {
              this.setState(
                {
                  newDocumentName: e.target.value,
                },
                () => {
                  this.setState({
                    modalContent: this.renderCreateForm(),
                  });
                }
              );
            }
          }}
          fullWidth
        />
        <FormControl>
          <InputLabel>Välj karta</InputLabel>
          <Select
            onChange={(e) => {
              this.setState({
                newDocumentMap: e.target.value,
              });
            }}
          >
            {this.renderMaps()}
          </Select>
        </FormControl>
      </>
    );
  }

  renderCreateDialog(chapter, parentChapters, index) {
    this.setState({
      showModal: true,
      showAbortButton: true,
      modalTitle: "Skapa nytt dokument",
      modalContent: this.renderCreateForm(),
      okButtonText: "Spara",
      modalConfirmCallback: () => {
        var data = {
          documentName: this.state.newDocumentName,
          mapName: this.state.newDocumentMap,
        };
        if (data.documentName !== "") {
          this.props.model.createDocument(data, (response) => {
            this.load(data.documentName);
          });
          this.hideModal();
        }
      },
    });
  }

  saveTableOfContents() {
    const tableOfContents = {
      expanded: this.state.newTableOfContentsExpanded,
      active: this.state.newTableOfContentsActive,
      chapterLevelsToShow: this.state.newTableOfContentsLevels,
      title: this.state.newTableOfContentsTitle,
    };

    this.setState({
      data: {
        ...this.state.data,
        tableOfContents: tableOfContents,
      },
      tableOfContentsModal: false,
    });
  }

  renderTableOfContentsModal() {
    this.setState({
      showModal: true,
      modalTitle: "Innehållsförteckning",
      modalContent: this.renderTableOfContentsInput(),
      showAbortButton: true,

      modalConfirmCallback: () => {},
    });
  }

  renderTableOfContentsInput() {
    return (
      <FormGroup row>
        <FormControlLabel
          control={
            <Switch
              checked={this.state.newTableOfContentsActive}
              onChange={(e) => {
                this.setState({
                  [e.target.name]: e.target.checked,
                });
              }}
              name="newTableOfContentsActive"
              color="primary"
            />
          }
          label="Aktiverad"
        />
        <FormControlLabel
          control={
            <Switch
              checked={this.state.newTableOfContentsExpanded}
              onChange={(e) => {
                this.setState({
                  [e.target.name]: e.target.checked,
                });
              }}
              name="newTableOfContentsExpanded"
              color="primary"
            />
          }
          label="Expanderad"
        />
        <TextField
          margin="dense"
          id="tableOfContentsTitle"
          label="Titel"
          type="text"
          defaultValue={this.state.newTableOfContentsTitle}
          onChange={(e) => {
            this.setState({
              newTableOfContentsTitle: e.target.value,
            });
          }}
          fullWidth
        />
        <TextField
          margin="dense"
          id="tableOfContentsChapters"
          label="Nivåer"
          type="number"
          defaultValue={this.state.newTableOfContentsLevels}
          onChange={(e) => {
            this.setState({
              newTableOfContentsLevels: parseInt(e.target.value),
            });
          }}
          fullWidth
        />
      </FormGroup>
    );
  }

  toggleTitleEdit = () => {
    this.setState({
      editTitle: !this.state.editTitle,
    });
  };

  saveTitle() {
    this.setState({
      data: {
        ...this.state.data,
        title: this.state.documentTitle,
      },
      editTitle: false,
    });
  }

  renderEditTitle() {
    return (
      <TextField
        placeholder="Titel"
        helperText="Titel som visas i dokumentfönster"
        value={this.state.documentTitle}
        onChange={(e) => {
          this.setState({
            documentTitle: e.target.value,
          });
        }}
      />
    );
  }

  render() {
    const { classes } = this.props;

    return (
      <Grid className={classes.root} id="documentEditor" container>
        <Grid className="inset-form" item container>
          <Typography>
            <strong>Generella dokumentinställningar</strong>
          </Typography>

          {this.renderModal()}
          <Grid
            className={classes.gridItemContainer}
            alignContent="center"
            container
            item
          >
            <Grid className={classes.gridItem} item>
              <FormControl>
                <NativeSelect
                  value={10}
                  onChange={(e) => {
                    this.load(e.target.value);
                  }}
                  value={this.state.selectedDocument}
                >
                  <option value="" disabled>
                    Välj ett dokument
                  </option>
                  {this.renderDocuments()}
                </NativeSelect>
                <FormHelperText>Välj ett befintligt dokument</FormHelperText>
              </FormControl>
            </Grid>
            <Grid className={classes.gridItem} item>
              {this.renderEditTitle()}
            </Grid>
            <Grid container item>
              {/*this.renderMapName()*/}
            </Grid>
          </Grid>
          <Grid className={classes.gridItemContainer} item container>
            <Grid className={classes.gridItem} item>
              <ColorButtonGreen
                variant="contained"
                className="btn"
                onClick={() => this.renderCreateDialog()}
                startIcon={<AddBoxIcon />}
              >
                Nytt dokument
              </ColorButtonGreen>
            </Grid>
            <Grid className={classes.gridItem}>
              <ColorButtonRed
                variant="contained"
                className="btn btn-danger"
                onClick={() => this.delete()}
                startIcon={<RemoveIcon />}
              >
                Ta bort
              </ColorButtonRed>
            </Grid>
            <Grid className={classes.gridItem}>
              <ColorButtonBlue
                variant="contained"
                className="btn"
                onClick={() => this.save()}
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
            </Grid>
          </Grid>
          <Grid className={classes.gridItemContainer} container item>
            <Grid className={classes.gridItem} item>
              <Button
                variant="contained"
                className="btn btn-default"
                onClick={() => {
                  this.renderTableOfContentsModal();
                }}
                startIcon={<TocIcon />}
              >
                Innehållsförteckning
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid className={classes.addHeadChapterButton} container item>
          <DocumentChapter
            buttonCaption={"Lägg till huvudkapitel"}
            onAddChapter={(title, titleID) => this.addChapter(title, titleID)}
          />
        </Grid>
        <Grid className="inset-form" container item>
          {this.renderData()}
        </Grid>
      </Grid>
      //
    );
  }
}

export default withStyles(styles)(DocumentEditor);
