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

class Chapter {
  constructor(settings) {
    settings = settings || {};
    this.header = settings.header || "";
    this.html = settings.html || "";
    this.mapSettings = {
      layers: settings.layers || [],
      center: settings.center || [900000, 8500000],
      zoom: settings.zoom || 10
    };
    this.chapters = [];
  }
}

class InformativeEditor extends Component {
  constructor() {
    super();
    this.state = {
      showModal: false,
      data: undefined
    };
    this.editors = [];
  }

  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.props.model.load(data => {
      this.setState({
        data: data
      });
    });
    this.props.model.loadMaps(maps => {
      this.setState({
        maps: maps,
        map: maps[0]
      });
    });
  }

  save() {
    this.props.model.save(JSON.stringify(this.state.data), result => {
      if (result === "File saved") {
        result = "Filen sparades utan problem.";
      }
      this.setState({
        showModal: true,
        modalContent: result,
        showAbortButton: false,
        modalConfirmCallback: () => {}
      });
    });
  }

  addChapter(title) {
    this.state.data.chapters.push(
      new Chapter({
        header: title
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
          onMapUpdate={state => updateMapSettings(state)}
          onLayersUpdate={state => updateLayersSettings(state)}
        />
      ),
      modalConfirmCallback: () => {
        this.hideModal();
        chapter.mapSettings = {
          center: mapState.center,
          zoom: mapState.zoom
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

  renderChapter(parentChapters, chapter, index) {
    var arrowStyle = !!chapter.expanded
      ? "fa fa-chevron-down pointer"
      : "fa fa-chevron-right pointer";

    return (
      <div key={Math.random() * 1e8} className="chapter">
        <h1>
          <span
            className={arrowStyle}
            onClick={() => {
              chapter.expanded = !chapter.expanded;
              this.forceUpdate();
            }}
          />
          {chapter.header}
        </h1>
        <ChapterAdder
          onAddChapter={title => {
            chapter.chapters.push(
              new Chapter({
                header: title
              })
            );
            this.forceUpdate();
          }}
        />
        &nbsp;
        <span
          className="btn btn-success"
          onClick={() => {
            this.renderMapDialog(chapter);
          }}
        >
          Kartinställningar
        </span>
        &nbsp;
        <span
          className="btn btn-danger"
          onClick={() => {
            this.removeChapter(parentChapters, index);
          }}
        >
          Ta bort rubrik
        </span>
        <RichEditor
          display={chapter.expanded}
          html={chapter.html}
          onUpdate={html => {
            chapter.html = html;
          }}
        />
        {chapter.chapters.map((innerChapter, innerIndex) => {
          return this.renderChapter(chapter.chapters, innerChapter, innerIndex);
        })}
      </div>
    );
  }

  renderData() {
    if (this.state.data) {
      return this.state.data.chapters.map((chapter, index) =>
        this.renderChapter(this.state.data.chapters, chapter, index)
      );
    }
  }

  renderModal() {
    var abortButton = this.state.showAbortButton ? (
      <button className="btn btn-danger" onClick={e => this.hideModal()}>
        Avbryt
      </button>
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
          <button
            className="btn btn-success"
            onClick={e => {
              if (this.state.modalConfirmCallback) {
                this.state.modalConfirmCallback();
              }
              this.hideModal();
            }}
          >
            Ok
          </button>
          &nbsp;
          {abortButton}
        </div>
      </ReactModal>
    );
  }

  renderMaps() {
    if (this.state.maps) {
      return this.state.maps.map((map, i) => {
        return (
          <option
            onChange={() => {
              this.setState({
                map: map
              });
            }}
            key={i}
          >
            {map}
          </option>
        );
      });
    } else {
      return null;
    }
  }

  render() {
    return (
      <div>
        {this.renderModal()}
        <div className="inset-form">
          <label>Välj karta:&nbsp;</label>
          <select>{this.renderMaps()}</select>
        </div>
        <div className="padded">
          <span className="btn btn-success" onClick={() => this.save()}>
            Spara
          </span>
          &nbsp;
          <ChapterAdder onAddChapter={title => this.addChapter(title)} />
        </div>
        {this.renderData()}
      </div>
    );
  }
}

export default InformativeEditor;
