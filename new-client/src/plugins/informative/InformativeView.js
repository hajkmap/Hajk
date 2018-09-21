import React, { Component } from "react";
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import "./style.css";

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
    this.state = {
      chapters: [],
      chapter: {
        header: "",
        html: "<span></span>"
      }
    };
  }

  componentDidMount() {
    this.props.parent.informativeModel.load(chapters => {
      this.toc = chapters;
      var state = {
        chapters: chapters,
        chapter: {
          header: "",
          html: "<span></span>"
        }
      };
      this.setState(state);
      this.props.app.observer.publish('informativeLoaded', chapters);
    });
    this.props.observer.subscribe('changeChapter', (chapter) => {
      this.setState({
        chapters: chapter.chapters,
        chapter: chapter
      });
    });
  }

  displayMap(layers, mapSettings) {
    this.props.parent.informativeModel.displayMap(layers, mapSettings);
  }

  renderLayerItems(chapter) {
    const { classes } = this.props;
    if (Array.isArray(chapter.layers) && chapter.layers.length > 0) {
      return (
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={() => {
            this.displayMap(
              chapter.layers,
              chapter.mapSettings
            );
            if (document.body.scrollWidth < 600) {
              this.props.parent.closePanel();
            }
          }}>
          Visa karta
          <Icon className={classes.rightIcon}>map</Icon>
        </Button>
      )
    }
  }

  renderTocItem(chapters) {
    return chapters.map((chapter, i) => {
      return <ListItem button key={i} className="chapter" onClick={() => {
        var state = {
          chapters: chapter.chapters,
          chapter: chapter
        };
        this.setState(state);
      }}> <ListItemText primary={chapter.header} /></ListItem>
    });
  }

  createMarkup() {
    return { __html: this.state.chapter.html };
  }

  renderContent() {
    return <div dangerouslySetInnerHTML={this.createMarkup()}></div>
  }

  findParentInToc(lookupChapter, chapters, parent) {
    var foundParent = false;
    chapters.forEach(chapter => {
      if (chapter.chapters.length > 0 && !foundParent) {
        foundParent = this.findParentInToc(lookupChapter, chapter.chapters, chapter);
      }
      if (lookupChapter === chapter && !foundParent) {
          foundParent = {
            chapter: parent,
            chapters: chapters
          }
      }
    });
    return foundParent;
  }

  renderBackButton() {
    const { classes } = this.props;
    if (!this.state.chapter.header) {
      return null;
    }
    return (
      <Button
        variant="outlined"
        color="primary"
        className={classes.button}
        onClick={() => {
          var parent = this.findParentInToc(this.state.chapter, this.toc, null);
          if (parent) {
            this.setState({
              chapter: parent.chapter || {
                header: "",
                html: "<span></span>"
              },
              chapters: parent.chapters
            });
          }

        }}
      >Tillbaka</Button>
    );
  }

  render() {
    return (
      <div>
        <div>
          {this.renderBackButton()}
        </div>
        <List component="nav" className="toc">{this.renderTocItem(this.state.chapters)}</List>
        <div className="layers">{this.renderLayerItems(this.state.chapter)}</div>
        <h1>{this.state.chapter.header}</h1>
        <div className="content">{this.renderContent()}</div>
      </div>
    );
  }
}

export default withStyles(styles)(Informative);
