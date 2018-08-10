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
import RichEditor from './components/RichEditor.jsx'
import ChapterAdder from './components/ChapterAdder.jsx'

class InformativeEditor extends Component {
  constructor () {
    super();
    this.state = {
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
      alert(result);
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

  renderChapter(chapter, level) {    
    level = level + 1;    
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
        }} />
        <RichEditor html={chapter.html} ref={(editor) => { this.editors.push(editor); }} onUpdate={(html) => {
          chapter.html = html;          
        }} />
        {chapter.chapters.map(innerChapter => {          
          return this.renderChapter(innerChapter, level);
        })}
      </div>
    );
  }

  renderData() {
    if (this.state.data) {
      return (
        this.state.data.chapters.map(chapter => 
          this.renderChapter(chapter, 0))
      );
    }
  }

  render () {    
    return (
      <div>        
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
