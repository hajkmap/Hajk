import React, { Component } from "react";
import Observer from "react-event-observer";
import InformativeModel from "./model.js";
import { createPortal } from "react-dom";
import "./style.css";
import PanelHeader from "../../components/PanelHeader.js";

import PropTypes from 'prop-types';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';
import SaveIcon from '@material-ui/icons/Save';

var history = (function () {
  var history = [];
  return {
    add: (state) => {          
      history = [state, ...history];      
    },
    remove: () => {
      history.splice(0, 1);   
    },
    get: () => {
      return history;
    },
    getLast: () => {
      return history[0];
    }    
  };
}());

const styles = theme => ({
  button: {
    margin: theme.spacing.unit,
  },
  leftIcon: {
    marginRight: theme.spacing.unit,
  },
  rightIcon: {
    marginLeft: theme.spacing.unit,
  },
  iconSmall: {
    fontSize: 20,
  },
});

class Informative extends Component {
  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false,
      text: "Laddar...",
      chapters: [],
      chapter: {
        header: "",
        html: "<span></span>"
      }
    };
  }

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.informativeModel = new InformativeModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
    this.informativeModel.load(chapters => {
      var state = {
        chapters: chapters,
        chapter: {
          header: "",
          html: "<span></span>"
        }
      };      
      this.setState(state);
      history.add(state)
    });
  }

  open() {
    this.setState({
      toggled: true
    });
  }

  close() {
    this.setState({
      toggled: false
    });
  }

  minimize() {
    this.setState({
      toggled: false
    });
  }

  toggle() {    
    if (!this.state.toggled && this.props.toolbar) {
      this.props.toolbar.hide();
    }
    this.setState({
      toggled: !this.state.toggled
    });    
  }

  getActiveClass() {    
    const customClass = "informative-";
    var activeClass = "tool-toggle-button active";
    var inactiveClass = "tool-toggle-button active";  
    if (this.props.tool.target !== "toolbar") {
      activeClass = customClass + activeClass;
      inactiveClass = customClass + inactiveClass;
    }
    return this.state.toggled
      ? activeClass
      : inactiveClass;
  }

  getVisibilityClass() {
    return this.state.toggled
      ? "tool-panel informative-panel"
      : "tool-panel informative-panel hidden";
  }

  getOpen() {
    return this.state.toggled ? "open" : "";
  }

  displayMap(layers, mapSettings) {
    this.informativeModel.displayMap(layers, mapSettings);
  }

  renderLayerItems(chapter) {
    const { classes } = this.props;
    if (Array.isArray(chapter.layers) && chapter.layers.length > 0) {
      return (
        <Button variant="contained" color="primary" className={classes.button} onClick={() => this.displayMap(chapter.layers, chapter.mapSettings)}>
          Visa karta
          <Icon className={classes.rightIcon}>map</Icon>
        </Button>      
      )
    }
  }
  
  renderTocItem(chapters) {    
    return chapters.map((chapter, i) => {
      return <div key={i} className="chapter" onClick={() => {         
        var state = {
          chapters: chapter.chapters,
          chapter: chapter          
        }; 
        this.setState(state);
        history.add(state);
      }}>{chapter.header}</div>
    });
  }
  
  createMarkup() {        
    return { __html: this.state.chapter.html };
  }

  renderContent() {
    return <div dangerouslySetInnerHTML={this.createMarkup()}></div>
  }  

  renderBackButton() {    
    if (history.get().length === 1) {
      return null;
    } else {
      return (
        <a href="#back" onClick={() => {
          history.remove();          
          this.setState(history.getLast());          
        }}>Tillbaka</a>
      );
    }
  }

  renderPanel() {    
    return createPortal(
      <div className={this.getVisibilityClass()}>
        <PanelHeader title="Översiktsplan" toggle={this.toggle} />
        <div className="tool-panel-content">
          <div>
            {this.renderBackButton()}
          </div>
          <div className="toc">{this.renderTocItem(this.state.chapters)}</div>
          <div className="layers">{this.renderLayerItems(this.state.chapter)}</div>
          <h1>{this.state.chapter.header}</h1>
          <div className="content">{this.renderContent()}</div>
        </div>
      </div>,
      document.getElementById("map")
    );
  }

  render() {    
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>
          <i className="material-icons">satellite</i>
          <i className="tool-text">Översiktsplan</i>
        </div>
        {this.renderPanel()}
      </div>
    );
  }
}

export default withStyles(styles)(Informative);
