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

import React from 'react';
import { Component } from 'react';
import ReactModal from 'react-modal';
import RichEditor from './components/RichEditor.jsx'
import ChapterAdder from './components/ChapterAdder.jsx'

class InformativeEditor extends Component {
  constructor () {
    super();
    this.state = {
      showModal: false,
      data: undefined      
    };    
    this.editors = [];
  }

  componentDidMount() {
    this.props.model.load(data => {      
      this.setState({
        data: data
      });
    });
  }

  save() {
    this.props.model.save(JSON.stringify(this.state.data), (result) => {
      if (result === "File saved") {
        result = "Filen sparades utan problem."
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
    this.state.data.chapters.push({
      header: title,
      html: "",
      layers: [],
      chapters: []
    });
    
    this.setState({
      data: this.state.data
    });
  }    
  
  removeChapter(parentChapters, index) {
    this.setState({
      showModal: true,
      modalContent: 'Detta kapitel och dess underkapitel kommer att tas bort, det går inte att ångra ditt val. Vill du verkställa ändringen?',
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
      modalConfirmCallback: () => {}
    });
  }

  renderChapter(parentChapters, chapter, index) {
    return (
      <div key={Math.random() * 1E8} className="chapter">        
        <h1>{chapter.header}</h1>
        <ChapterAdder onAddChapter={title => {          
          chapter.chapters.push({
            header: title,
            html: "",
            layers: [],
            chapters: []
          });
          this.forceUpdate();
        }} />&nbsp;
        <span className="btn btn-danger" onClick={() => {          
          this.removeChapter(parentChapters, index);
        }} >Ta bort rubrik</span>        
        <RichEditor html={chapter.html} ref={(editor) => { this.editors.push(editor); }} onUpdate={(html) => {
          chapter.html = html;          
        }} />
        {chapter.chapters.map((innerChapter, innerIndex) => {          
          return this.renderChapter(chapter.chapters, innerChapter, innerIndex);
        })}
      </div>
    );
  }

  renderData() {
    if (this.state.data) {
      return (
        this.state.data.chapters.map((chapter, index) => 
          this.renderChapter(this.state.data.chapters, chapter, index))
      );
    }
  }

  renderModal() {
    var abortButton = this.state.showAbortButton 
      ? <button className="btn btn-danger" onClick={(e) => this.hideModal()}>Avbryt</button> 
      : "";

    return (
      <ReactModal
        isOpen={this.state.showModal}
        contentLabel="Bekräfta"
        className="Modal"
        overlayClassName="Overlay"
        appElement={document.getElementById('root')}
      >
        <p>{this.state.modalContent}</p>     
        <button className="btn btn-success" onClick={(e) => {
          this.state.modalConfirmCallback();
          this.hideModal();
        }}>Ok</button>&nbsp;
        {abortButton}
      </ReactModal>
    )
  }

  render () {    
    return (
      <div>     
        {this.renderModal()}
        <div className="padded">
          <span className="btn btn-success" onClick={() => this.save()}>Spara</span>&nbsp;
          <ChapterAdder onAddChapter={title => this.addChapter(title)} />
        </div>
        {this.renderData()}
      </div>
    );
  }
}

export default InformativeEditor;
