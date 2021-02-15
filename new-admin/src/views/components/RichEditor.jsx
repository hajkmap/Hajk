import React from "react";
import { Component } from "react";
import {
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  AtomicBlockUtils,
  getDefaultKeyBinding
} from "draft-js";
//import { Editor } from "draft-extend";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/DoneOutline";
import AddIcon from "@material-ui/icons/Add";
import CancelIcon from "@material-ui/icons/Cancel";
import EditIcon from "@material-ui/icons/Edit";
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
class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = "RichEditor-styleButton";
    if (this.props.active) {
      className += " RichEditor-activeButton";
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

function mediaBlockRenderer(block) {
  if (block.getType() === "atomic") {
    return {
      component: Media,
      editable: false
    };
  }

  return null;
}

function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "RichEditor-blockquote";
    default:
      return null;
  }
}

const Image = props => {
  return <img src={props.src} alt="external" />;
};

const Media = props => {
  const entity = props.contentState.getEntity(props.block.getEntityAt(0));
  const { src } = entity.getData();
  let media = <Image src={src} />;
  return media;
};

const styleMap = {
  CODE: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2
  }
};

const BLOCK_TYPES = [
  { label: "H1", style: "header-one" },
  { label: "H2", style: "header-two" },
  { label: "H3", style: "header-three" },
  { label: "H4", style: "header-four" },
  { label: "H5", style: "header-five" },
  { label: "H6", style: "header-six" },
  { label: "Citat", style: "blockquote" },
  { label: "UL", style: "unordered-list-item" },
  { label: "OL", style: "ordered-list-item" }
];

var INLINE_STYLES = [
  { label: "Fet", style: "BOLD" },
  { label: "Kursiv", style: "ITALIC" },
  { label: "Understuken", style: "UNDERLINE" }
];

const BlockStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

const InlineStyleControls = props => {
  const currentStyle = props.editorState.getCurrentInlineStyle();

  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

class ImageButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url:
        "https://www.kitchentreaty.com/wp-content/uploads/2017/05/vegan-vanilla-bean-waffles-image-660x430.jpg",
      urlInputVisible: false
    };
  }

  addImage() {
    this.props.addImage(this.state.url);
  }

  urlChanged(e) {
    this.setState({
      url: e.target.value
    });
  }

  renderUrlInput() {
    var style = {
      color: "black",
      marginBottom: "5px"
    };
    if (this.state.urlInputVisible) {
      return (
        <div style={style}>
          <input type="text" name="url" onChange={e => this.urlChanged(e)} />
          &nbsp;
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => {
              this.addImage();
            }}
            startIcon={<AddIcon />}
          >
            Lägg till
          </ColorButtonGreen>
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    var style = {
      color: "black",
      marginBottom: "5px"
    };
    return (
      <div>
        <span
          style={style}
          className="RichEditor-styleButton fa fa-image"
          onClick={() => {
            this.setState({
              urlInputVisible: !this.state.urlInputVisible
            });
          }}
        />
        {this.renderUrlInput()}
      </div>
    );
  }
}

class RichEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createWithContent(
        stateFromHTML(this.props.html)
      ),
      readonly: true,
      html: this.props.html
    };
    this.focus = () => this.refs.editor.focus();
    this.onChange = editorState => this.setState({ editorState });
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _mapKeyToEditorCommand(e) {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        this.state.editorState,
        4 /* maxDepth */
      );
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }
    return getDefaultKeyBinding(e);
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }

  addImage(url) {
    //const url = "https://www.kitchentreaty.com/wp-content/uploads/2017/05/vegan-vanilla-bean-waffles-image-660x430.jpg";

    const { editorState } = this.state;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "image",
      "IMMUTABLE",
      { src: url }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });
    this.setState(
      {
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          " "
        )
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }

  componentDidMount() {}

  getHtml() {
    const content = this.state.editorState.getCurrentContent();
    return stateToHTML(content);
  }

  toggleReadonly() {
    this.props.onUpdate(this.getHtml());
    this.setState({
      readonly: !this.state.readonly,
      html: this.getHtml()
    });
  }

  cancel() {
    this.setState({
      readonly: !this.state.readonly
    });
  }

  createMarkup(html) {
    return {
      __html: html
    };
  }

  handlePastedText = (text = "", html) => {
    // If clipboard contains unformatted text, the first parameter
    // is used, while the second is empty. In the code below, we
    // only take care for the second parameter. So to handle
    // those cases where unformatted text is pasted in, we must
    // ensure that the second paramter always is defined.
    // That can be done by copying the contents of the first parameter
    // if the second parameter is empty/undefined.
    if (html?.trim().length === 0 || html === undefined) {
      html = text;
    }
    const { editorState } = this.state;
    const generatedState = stateFromHTML(html);
    const generatedHtml = stateToHTML(generatedState);
    const el = document.createElement("div");
    el.innerHTML = generatedHtml;

    const images = el.getElementsByTagName("img");

    for (let i = 0; i < images.length; i++) {
      let img = images[i];
      img.src = img.alt;
      img.alt = "";
      let figure = document.createElement("figure");
      figure.innerHTML = img.outerHTML;
      img.parentNode.replaceChild(figure, img);
    }

    if (el.lastChild.getElementsByTagName("figure").length > 0) {
      let p = document.createElement("p");
      p.innerHTML = "&nbsp;";
      el.appendChild(p);
    }

    const blockMap = stateFromHTML(el.outerHTML).blockMap;
    const newState = Modifier.replaceWithFragment(
      editorState.getCurrentContent(),
      editorState.getSelection(),
      blockMap
    );
    this.onChange(EditorState.push(editorState, newState, "insert-fragment"));

    return true;
  };

  render() {
    const { editorState } = this.state;
    let className = "RichEditor-editor";
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (
        contentState
          .getBlockMap()
          .first()
          .getType() !== "unstyled"
      ) {
        className += " RichEditor-hidePlaceholder";
      }
    }
    if (!this.props.display) {
      return null;
    }
    if (this.state.readonly) {
      return (
        <div className="margined">
          <ColorButtonBlue
            variant="contained"
            className="btn"
            onClick={() => this.toggleReadonly()}
            startIcon={<EditIcon />}
          >
            Redigera text
          </ColorButtonBlue>
          <div dangerouslySetInnerHTML={this.createMarkup(this.state.html)} />
        </div>
      );
    } else {
      return (
        <div className="margined">
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => this.toggleReadonly()}
            startIcon={<DoneIcon />}
          >
            Ok
          </ColorButtonGreen>
          &nbsp;
          <ColorButtonRed
            variant="contained"
            className="btn btn-danger"
            onClick={() => this.cancel()}
            startIcon={<CancelIcon />}
          >
            Avbryt
          </ColorButtonRed>
          <div className="RichEditor-root">
            <ImageButton addImage={url => this.addImage(url)} />
            <BlockStyleControls
              editorState={editorState}
              onToggle={this.toggleBlockType}
            />
            <InlineStyleControls
              editorState={editorState}
              onToggle={this.toggleInlineStyle}
            />
            <div className={className} onClick={this.focus}>
              <Editor
                blockStyleFn={getBlockStyle}
                customStyleMap={styleMap}
                blockRendererFn={mediaBlockRenderer}
                editorState={editorState}
                handlePastedText={this.handlePastedText}
                handleKeyCommand={this.handleKeyCommand}
                keyBindingFn={this.mapKeyToEditorCommand}
                onChange={this.onChange}
                placeholder=""
                ref="editor"
                spellCheck={true}
              />
            </div>
          </div>
        </div>
      );
    }
  }
}

export default RichEditor;
