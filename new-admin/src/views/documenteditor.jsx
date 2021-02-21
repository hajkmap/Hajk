import React from "react";
import { Component } from "react";
import ReactModal from "react-modal";
import DocumentTextEditor from "./components/DocumentTextEditor.jsx";
import DocumentChapter from "./components/DocumentChapter.jsx";
import AddKeyword from "./components/AddKeyword.jsx";
import AddGeoObject from "./components/AddGeoObject.jsx";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/Done";
import RemoveIcon from "@material-ui/icons/Remove";
import SaveIcon from "@material-ui/icons/SaveSharp";
import CancelIcon from "@material-ui/icons/Cancel";
import NoteAddIcon from "@material-ui/icons/NoteAdd";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";
import Chip from "@material-ui/core/Chip";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import Modal from "@material-ui/core/Modal";

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
    };
    this.editors = [];
  }

  load(document) {
    this.props.model.loadDocuments((documents) => {
      if (documents.length > 0) {
        this.props.model.load(document || documents[0], (data) => {
          this.setState(
            {
              data: data,
              documents: documents,
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
          modalContent: result,
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
      <form
        onSubmit={(e) => {
          this.state.modalConfirmCallback();
          e.preventDefault();
        }}
      >
        <label>Ange nytt namn</label>&nbsp;
        <input
          defaultValue={this.state.newChapterName}
          type="text"
          onChange={(e) => {
            this.setState({
              newChapterName: e.target.value,
            });
          }}
        />
        <label>Ange nytt ID</label>
        <input
          defaultValue={this.state.newHeaderIdentifier}
          type="text"
          onChange={(e) => {
            this.setState({
              newHeaderIdentifier: e.target.value,
            });
          }}
        />
      </form>
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
              Flytta
            </Button>
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                this.moveChapter("up", parentChapters, index);
              }}
            >
              Upp
            </Button>
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                this.moveChapter("down", parentChapters, index);
              }}
            >
              Ner
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
            <Button
              variant="contained"
              className="btn btn-default"
              onClick={() => {
                this.removeChapter(parentChapters, index);
              }}
            >
              Ta bort
            </Button>
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
                  headerIdentifier: titleID,
                })
              );
              this.forceUpdate();
            }}
          />

          <AddKeyword
            onAddKeyword={(keyword) => {
              chapter.keywords.push(keyword);
              this.setState({
                keywords: chapter.keywords,
              });
              this.forceUpdate();
            }}
          />

          <AddGeoObject
            onAddGeoObject={(geoObject) => {
              this.setState({
                geoObjects: chapter.geoObjects,
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
        </div>

        <div className="document-geo-objects">
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
        </div>

        <DocumentTextEditor
          display={chapter.expanded}
          html={chapter.html}
          onUpdate={(html) => {
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
          <p>
            Detta dokument tillhör följande karta: <b>{this.state.data.map}</b>
          </p>
          <Button
            variant="contained"
            className="btn btn-default"
            onClick={() => {
              this.setState({
                tableOfContentsModal: !this.state.tableOfContentsModal,
              });
            }}
          >
            Redigera innehållsförteckning
          </Button>
          {this.state.data.chapters.map((chapter, index) =>
            this.renderChapter(this.state.data.chapters, chapter, index)
          )}
        </div>
      );
    }
  }

  renderModal() {
    var abortButton = this.state.showAbortButton ? (
      <ColorButtonRed
        variant="contained"
        className="btn"
        onClick={(e) => this.hideModal()}
        startIcon={<CancelIcon />}
      >
        Avbryt
      </ColorButtonRed>
    ) : (
      ""
    );

    return (
      <ReactModal
        isOpen={this.state.showModal}
        contentLabel="Bekräfta"
        className="Modal"
        overlayClassName="Overlay"
        style={this.state.modalStyle}
        appElement={document.getElementById("root")}
      >
        <div style={{ height: "100%", padding: "15px" }}>
          <div
            style={{
              height: "100%",
              marginBottom: "150px",
              float: "left",
            }}
          >
            {this.state.modalContent}
          </div>
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
          &nbsp;
          {abortButton}
        </div>
      </ReactModal>
    );
  }

  renderMaps() {
    if (this.state.maps) {
      return this.state.maps.map((map, i) => {
        return <option key={i}>{map}</option>;
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
      <form
        onSubmit={(e) => {
          this.state.modalConfirmCallback();
          e.preventDefault();
        }}
      >
        <div>
          <label>Namn</label>&nbsp;
          <input
            type="text"
            id="new-document-name"
            value={this.state.newDocumentName}
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
          />
        </div>
        <div className="inset-form">
          <label>Välj karta:&nbsp;</label>
          <select
            onChange={(e) => {
              this.setState({
                newDocumentMap: e.target.value,
              });
            }}
          >
            {this.renderMaps()}
          </select>
        </div>
      </form>
    );
  }

  renderCreateDialog(chapter, parentChapters, index) {
    this.setState({
      showModal: true,
      showAbortButton: true,
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
    return (
      <Modal
        open={this.state.tableOfContentsModal}
        onClose={() => this.saveTableOfContents()}
        id="edit-image-modal"
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {this.renderTableOfContentsInput()}
      </Modal>
    );
  }

  renderTableOfContentsInput() {
    return (
      <div className="toc-modal">
        <h3>Innehållsförteckning</h3>
        <div>
          <b>Aktiverad:</b>
          <Switch
            checked={this.state.newTableOfContentsActive}
            onChange={(e) => {
              this.setState({
                newTableOfContentsActive: e.target.checked,
              });
            }}
            color="primary"
            name="tableOfContents"
            inputProps={{ "aria-label": "secondary checkbox" }}
          />
        </div>
        <div>
          <b>Expanderad:</b>
          <Switch
            checked={this.state.newTableOfContentsExpanded}
            onChange={(e) => {
              this.setState({
                newTableOfContentsExpanded: e.target.checked,
              });
            }}
            color="primary"
            name="tableOfContentsExpanded"
            inputProps={{ "aria-label": "secondary checkbox" }}
          />
        </div>
        <div>
          <b>Nivåer:</b>
          <TextField
            id="tableOfContentsChapters"
            type="number"
            value={this.state.newTableOfContentsLevels}
            onChange={(e) => {
              this.setState({
                newTableOfContentsLevels: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div>
          <b>Titel:</b>
          <TextField
            id="tableOfContentsTitle"
            type="text"
            value={this.state.newTableOfContentsTitle}
            onChange={(e) => {
              this.setState({
                newTableOfContentsTitle: e.target.value,
              });
            }}
          />
        </div>

        <ColorButtonRed
          variant="contained"
          className="btn btn-danger"
          onClick={() => this.saveTableOfContents()}
          style={{ float: "right" }}
        >
          Stäng
        </ColorButtonRed>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderModal()}
        {this.renderTableOfContentsModal()}
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
            onChange={(e) => {
              this.load(e.target.value);
            }}
            value={this.state.selectedDocument}
          >
            {this.renderDocuments()}
          </select>
        </div>
        <div className="padded">
          <ColorButtonBlue
            variant="contained"
            className="btn"
            onClick={() => this.save()}
            startIcon={<SaveIcon />}
          >
            Spara
          </ColorButtonBlue>
          &nbsp;
          <DocumentChapter
            onAddChapter={(title, titleID) => this.addChapter(title, titleID)}
          />
          &nbsp;
          <ColorButtonRed
            variant="contained"
            className="btn btn-danger"
            onClick={() => this.delete()}
            startIcon={<RemoveIcon />}
          >
            Ta bort
          </ColorButtonRed>
        </div>
        <div className="chapters">{this.renderData()}</div>
      </div>
    );
  }
}

export default DocumentEditor;
