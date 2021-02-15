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
import NoteAddIcon from "@material-ui/icons/NoteAdd";
import EditIcon from "@material-ui/icons/Edit";
import { withStyles } from "@material-ui/core/styles";
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
import DescriptionIcon from "@material-ui/icons/Description";
import OpenWithIcon from "@material-ui/icons/OpenWith";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

const ColorButtonRed = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700]
    }
  }
}))(Button);

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

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
      editTitle: false
    };
    this.editors = [];
    this.documentTitle = React.createRef();
  }

  load(document) {
    this.props.model.loadDocuments(documents => {
      if (documents.length > 0) {
        this.props.model.load(document || documents[0], data => {
          this.setState(
            {
              data: data,
              documents: documents,
              documentTitle: data.title,
              selectedDocument: document || documents[0],
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
                  : "Innehållsförteckning"
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
                : "Innehållsförteckning"
            },
            () => {
              this.props.model.loadMaps(maps => {
                this.setState({
                  maps: maps,
                  map: data.map,
                  newDocumentMap: maps[0]
                });
              });
            }
          );
        });
      } else {
        this.props.model.loadMaps(maps => {
          this.setState({
            maps: maps,
            newDocumentMap: maps[0]
          });
        });
      }
    });
  }

  loadImageList() {
    this.props.model.listImages(data => {
      this.setState({
        imageList: data
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
      result => {
        if (result === "File saved") {
          result = "Filen sparades utan problem.";
        }
        this.setState({
          showModal: true,
          modalTitle: result,
          modalContent: "",
          showAbortButton: false,
          modalConfirmCallback: () => {}
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
        this.props.model.delete(this.state.selectedDocument, result => {
          this.load();
        });
      }
    });
  }

  addChapter(title, titleID) {
    this.state.data.chapters.push(
      new Chapter({
        header: title,
        headerIdentifier: titleID
      })
    );
    this.setState({
      data: this.state.data
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
      }
    });
  }

  hideModal() {
    this.setState({
      showModal: false,
      modalStyle: {},
      okButtonText: "OK",
      modalConfirmCallback: () => {}
    });
  }

  renderToc(currentChapter, chapters, parentChapters, index) {
    var renderChapters = subchapters => {
      var renderableChapters = subchapters ? subchapters : chapters;
      return renderableChapters.map((chapter, i) => {
        if (chapter !== currentChapter) {
          return (
            <div className="chapter" key={i}>
              <div
                className="toc"
                onClick={() => {
                  chapter.chapters.push(currentChapter);
                  parentChapters.splice(index, 1);
                  if (this.state.modalConfirmCallback) {
                    this.state.modalConfirmCallback();
                  }
                }}
              >
                {chapter.header}
              </div>
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
      <div className="toc-container">
        <p>
          Flytta <b>{currentChapter.header}</b> till:{" "}
        </p>
        <div>
          <div
            className="toc"
            onClick={() => {
              chapters.push(currentChapter);
              parentChapters.splice(index, 1);
              if (this.state.modalConfirmCallback) {
                this.state.modalConfirmCallback();
              }
            }}
          >
            Huvudkategori
          </div>
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
          margin: 0
        }
      }
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
          onChange={e => {
            this.setState({
              newChapterName: e.target.value
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
          onChange={e => {
            this.setState({
              newHeaderIdentifier: e.target.value
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
        newHeaderIdentifier: chapter.headerIdentifier
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
          }
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

  renderChapter(parentChapters, chapter, index) {
    var arrowStyle = !!chapter.expanded
      ? "fa fa-chevron-up pointer"
      : "fa fa-chevron-down pointer";

    return (
      <div key={Math.random() * 1e8} className="document-chapter">
        <div className="document-menu">
          <div className="document-chapter-header">
            <span>
              <b>{chapter.header}</b>
            </span>
          </div>
          <div className="document-menu-buttons">
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                this.renderTocDialog(chapter, parentChapters, index);
              }}
            >
              <OpenWithIcon />
            </Button>
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                this.moveChapter("up", parentChapters, index);
              }}
            >
              <ArrowUpwardIcon />
            </Button>
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                this.moveChapter("down", parentChapters, index);
              }}
            >
              <ArrowDownwardIcon />
            </Button>
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                this.renderChangeNameDialog(chapter);
              }}
            >
              Byt namn
            </Button>
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
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                chapter.expanded = !chapter.expanded;
                this.forceUpdate();
              }}
            >
              <span className={arrowStyle} />
            </Button>
          </div>
        </div>
        <div className="document-edit-menu">
          <span>Lägg till </span>
          <DocumentChapter
            onAddChapter={(title, titleID) => {
              chapter.chapters.push(
                new Chapter({
                  header: title,
                  headerIdentifier: titleID
                })
              );
              this.forceUpdate();
            }}
          />

          <AddKeyword
            onAddKeyword={keyword => {
              chapter.keywords.push(keyword);
              this.setState({
                keywords: chapter.keywords
              });
              this.forceUpdate();
            }}
          />

          <AddGeoObject
            onAddGeoObject={geoObject => {
              this.setState({
                geoObjects: chapter.geoObjects
              });
              chapter.geoObjects.push(geoObject);
              this.forceUpdate();
            }}
          />
        </div>

        <div className="document-keywords">
          {chapter.keywords
            ? chapter.keywords.map((keyword, i) => (
                <Chip
                  key={i}
                  label={keyword}
                  onDelete={i => {
                    const index = chapter.keywords.indexOf(keyword);
                    if (index > -1) {
                      chapter.keywords.splice(index, 1);
                    }
                    this.setState({
                      keywords: chapter.keywords
                    });
                  }}
                />
              ))
            : null}
        </div>

        <div className="document-geo-objects">
          {chapter.geoObjects
            ? chapter.geoObjects.map((geoObject, i) => (
                <Chip
                  key={i}
                  label={geoObject}
                  onDelete={i => {
                    const index = chapter.geoObjects.indexOf(geoObject);
                    if (index > -1) {
                      chapter.geoObjects.splice(index, 1);
                    }
                    this.setState({
                      geoObjects: chapter.geoObjects
                    });
                  }}
                />
              ))
            : null}
        </div>

        <DocumentTextEditor
          display={chapter.expanded}
          html={chapter.html}
          onUpdate={html => {
            chapter.html = html;
          }}
          imageList={this.state.imageList}
          documents={this.state.documents}
        />
        <div className="document-nested-chapter">
          {chapter.expanded
            ? chapter.chapters.map((innerChapter, innerIndex) => {
                return this.renderChapter(
                  chapter.chapters,
                  innerChapter,
                  innerIndex
                );
              })
            : null}
        </div>
      </div>
    );
  }

  renderData() {
    if (this.state.data) {
      return (
        <div>
          <div className="document-title">
            <p>
              Detta dokument tillhör följande karta:{" "}
              <b>{this.state.data.map}</b>
            </p>
            <div className="padded">
              <DescriptionIcon />
              <TextField
                id="documentTitle"
                style={{ margin: "4px" }}
                type="text"
                value={this.state.documentTitle}
                InputProps={{
                  readOnly: !this.state.editTitle
                }}
                variant={this.state.editTitle ? "outlined" : "filled"}
                onChange={e => {
                  this.setState({
                    documentTitle: e.target.value
                  });
                }}
              />
              {this.state.editTitle ? (
                <Button
                  variant="contained"
                  style={{ margin: "4px" }}
                  onClick={() => this.saveTitle()}
                >
                  <DoneIcon />
                </Button>
              ) : (
                <Button
                  variant="contained"
                  style={{ margin: "4px" }}
                  onClick={() => this.toggleTitleEdit()}
                >
                  <EditIcon />
                </Button>
              )}
              <div className="document-menu-buttons">
                <Button
                  variant="contained"
                  className="btn btn-default"
                  onClick={() => {
                    this.renderTableOfContentsModal();
                  }}
                >
                  Redigera innehållsförteckning
                </Button>
                <DocumentChapter
                  onAddChapter={(title, titleID) =>
                    this.addChapter(title, titleID)
                  }
                />
                <ColorButtonRed
                  variant="contained"
                  className="btn btn-danger"
                  onClick={() => this.delete()}
                  startIcon={<RemoveIcon />}
                >
                  Ta bort
                </ColorButtonRed>
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={() => this.save()}
                  startIcon={<SaveIcon />}
                >
                  Spara
                </ColorButtonBlue>
              </div>
            </div>
          </div>
          {this.state.data.chapters.map((chapter, index) =>
            this.renderChapter(this.state.data.chapters, chapter, index)
          )}
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
              onClick={e => {
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
          onChange={e => {
            if (this.validateNewDocumentName(e.target.value)) {
              this.setState(
                {
                  newDocumentName: e.target.value
                },
                () => {
                  this.setState({
                    modalContent: this.renderCreateForm()
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
            onChange={e => {
              this.setState({
                newDocumentMap: e.target.value
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
          mapName: this.state.newDocumentMap
        };
        if (data.documentName !== "") {
          this.props.model.createDocument(data, response => {
            this.load(data.documentName);
          });
          this.hideModal();
        }
      }
    });
  }

  saveTableOfContents() {
    const tableOfContents = {
      expanded: this.state.newTableOfContentsExpanded,
      active: this.state.newTableOfContentsActive,
      chapterLevelsToShow: this.state.newTableOfContentsLevels,
      title: this.state.newTableOfContentsTitle
    };

    this.setState({
      data: {
        ...this.state.data,
        tableOfContents: tableOfContents
      },
      tableOfContentsModal: false
    });
  }

  renderTableOfContentsModal() {
    this.setState({
      showModal: true,
      modalTitle: "Innehållsförteckning",
      modalContent: this.renderTableOfContentsInput(),
      showAbortButton: true,

      modalConfirmCallback: () => {}
    });
  }

  renderTableOfContentsInput() {
    return (
      <FormGroup row>
        <FormControlLabel
          control={
            <Switch
              checked={this.state.newTableOfContentsActive}
              onChange={e => {
                this.setState({
                  [e.target.name]: e.target.checked
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
              onChange={e => {
                this.setState({
                  [e.target.name]: e.target.checked
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
          onChange={e => {
            this.setState({
              newTableOfContentsTitle: e.target.value
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
          onChange={e => {
            this.setState({
              newTableOfContentsLevels: parseInt(e.target.value)
            });
          }}
          fullWidth
        />
      </FormGroup>
    );
  }

  toggleTitleEdit = () => {
    this.setState({
      editTitle: !this.state.editTitle
    });
  };

  saveTitle() {
    this.setState({
      data: {
        ...this.state.data,
        title: this.state.documentTitle
      },
      editTitle: false
    });
  }

  renderEditTitle() {
    return (
      <>
        <h2>Titel på dokument</h2>
        <TextField
          id="documentTitle"
          style={{ margin: "4px" }}
          type="text"
          value={this.state.documentTitle}
          InputProps={{
            readOnly: !this.state.editTitle
          }}
          variant={this.state.editTitle ? "outlined" : "filled"}
          onChange={e => {
            this.setState({
              documentTitle: e.target.value
            });
          }}
        />
        {this.state.editTitle ? (
          <Button
            variant="contained"
            style={{ margin: "4px" }}
            onClick={() => this.saveTitle()}
          >
            <DoneIcon />
          </Button>
        ) : (
          <Button
            variant="contained"
            style={{ margin: "4px" }}
            onClick={() => this.toggleTitleEdit()}
          >
            <EditIcon />
          </Button>
        )}
      </>
    );
  }

  render() {
    return (
      <div className="editor-container">
        {this.renderModal()}
        <div className="margined">
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => this.renderCreateDialog()}
            startIcon={<NoteAddIcon />}
          >
            Skapa nytt dokument
          </ColorButtonGreen>
        </div>
        <div className="inset-form">
          <label>Välj dokument:&nbsp;</label>
          <select
            className="control-fixed-width"
            onChange={e => {
              this.load(e.target.value);
            }}
            value={this.state.selectedDocument}
          >
            {this.renderDocuments()}
          </select>
        </div>
        <div className="chapters">{this.renderData()}</div>
      </div>
    );
  }
}

export default DocumentEditor;
