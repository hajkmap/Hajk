// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

import React from "react";
import { Component } from "react";
import ReactModal from "react-modal";
import RichEditor from "./components/RichEditor.jsx";
import ChapterAdder from "./components/ChapterAdder.jsx";
import Map from "./components/Map.jsx";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/Done";
import RemoveIcon from "@material-ui/icons/Remove";
import SaveIcon from "@material-ui/icons/SaveSharp";
import CancelIcon from "@material-ui/icons/Cancel";
import NoteAddIcon from "@material-ui/icons/NoteAdd";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

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
    this.html = settings.html || "";
    this.mapSettings = settings.mapSettings;
    this.chapters = [];
  }
}

class InformativeEditor extends Component {
  constructor() {
    super();
    this.state = {
      showModal: false,
      data: undefined,
      newChapterName: "",
      newDocumentName: "",
      newDocumentMap: "",
      documents: []
    };
    this.editors = [];
  }

  load(document) {
    this.props.model.loadDocuments(documents => {
      if (documents.length > 0) {
        this.props.model.load(document || documents[0], data => {
          this.setState(
            {
              data: data,
              documents: documents,
              selectedDocument: document || documents[0]
            },
            () => {
              this.props.model.loadMaps(maps => {
                this.setState(
                  {
                    maps: maps,
                    map: data.map,
                    newDocumentMap: maps[0]
                  },
                  () => {
                    this.props.model.loadMapSettings(data.map, settings => {
                      this.setState({
                        mapSettings: settings
                      });
                    });
                  }
                );
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

  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.load();
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
          modalContent: result,
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

  addChapter(title) {
    this.state.data.chapters.push(
      new Chapter({
        header: title,
        mapSettings: this.state.mapSettings
      })
    );
    this.setState({
      data: this.state.data
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

  renderMapDialog(chapter) {
    var mapState = {},
      checkedLayers = [],
      updateMapSettings = state => {
        mapState = state;
      },
      updateLayersSettings = state => {
        checkedLayers = state;
      };

    this.setState({
      showModal: true,
      showAbortButton: true,
      modalContent: (
        <Map
          config={this.props.config}
          map={this.state.map}
          chapter={chapter}
          mapSettings={this.state.mapSettings}
          onMapUpdate={state => updateMapSettings(state)}
          onLayersUpdate={state => updateLayersSettings(state)}
        />
      ),
      modalConfirmCallback: () => {
        this.hideModal();
        chapter.mapSettings = {
          center: mapState.center,
          zoom: mapState.zoom,
          extent: mapState.extent
        };
        chapter.layers = checkedLayers;
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
      <form
        onSubmit={e => {
          this.state.modalConfirmCallback();
          e.preventDefault();
        }}
      >
        <label>Ange nytt namn:</label>&nbsp;
        <input
          defaultValue={this.state.newChapterName}
          type="text"
          onChange={e => {
            this.setState({
              newChapterName: e.target.value
            });
          }}
        />
      </form>
    );
  }

  renderChangeNameDialog(chapter) {
    this.setState(
      {
        newChapterName: chapter.header
      },
      () => {
        this.setState({
          showModal: true,
          showAbortButton: true,
          modalContent: this.renderNameInput(),
          modalConfirmCallback: () => {
            chapter.header = this.state.newChapterName;
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
      ? "fa fa-chevron-down pointer"
      : "fa fa-chevron-right pointer";

    return (
      <div key={Math.random() * 1e8} className="chapter">
        <h1
          className="chapterHeader"
          onClick={() => {
            chapter.expanded = !chapter.expanded;
            this.forceUpdate();
          }}
        >
          <span className={arrowStyle} />
          {chapter.header}
        </h1>
        <ChapterAdder
          onAddChapter={title => {
            chapter.chapters.push(
              new Chapter({
                header: title,
                mapSettings: this.state.mapSettings
              })
            );
            this.forceUpdate();
          }}
        />
        &nbsp;
        <Button
          variant="contained"
          className="btn btn-default"
          onClick={() => {
            this.renderMapDialog(chapter);
          }}
        >
          Kartinställningar
        </Button>
        &nbsp;
        <Button
          variant="contained"
          className="btn btn-default"
          onClick={() => {
            this.renderTocDialog(chapter, parentChapters, index);
          }}
        >
          Flytta
        </Button>
        &nbsp;
        <Button
          variant="contained"
          className="btn btn-default"
          onClick={() => {
            this.moveChapter("up", parentChapters, index);
          }}
          startIcon={<ArrowUpwardIcon />}
        >
          Upp
        </Button>
        &nbsp;
        <Button
          variant="contained"
          className="btn btn-default"
          onClick={() => {
            this.moveChapter("down", parentChapters, index);
          }}
          startIcon={<ArrowDownwardIcon />}
        >
          Ner
        </Button>
        &nbsp;
        <Button
          variant="contained"
          className="btn btn-default"
          onClick={() => {
            this.renderChangeNameDialog(chapter);
          }}
        >
          Byt namn
        </Button>
        &nbsp;
        <ColorButtonRed
          variant="contained"
          className="btn btn-default"
          onClick={() => {
            this.removeChapter(parentChapters, index);
          }}
          startIcon={<RemoveIcon />}
        >
          Ta bort
        </ColorButtonRed>
        <RichEditor
          display={chapter.expanded}
          html={chapter.html}
          onUpdate={html => {
            chapter.html = html;
          }}
        />
        <div className="subChapters">
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
        onClick={e => this.hideModal()}
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
        <div style={{ height: "100%" }}>
          <div
            style={{
              height: "100%",
              paddingBottom: "45px",
              marginBottom: "-35px"
            }}
          >
            {this.state.modalContent}
          </div>
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
        onSubmit={e => {
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
          />
        </div>
        <div className="inset-form">
          <label>Välj karta:&nbsp;</label>
          <select
            onChange={e => {
              this.setState({
                newDocumentMap: e.target.value
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

  render() {
    return (
      <div>
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
          <ChapterAdder onAddChapter={title => this.addChapter(title)} />
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

export default InformativeEditor;
