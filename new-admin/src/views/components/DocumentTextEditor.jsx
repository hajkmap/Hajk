import React from "react";
import {
  EditorState,
  RichUtils,
  Modifier,
  AtomicBlockUtils,
  getDefaultKeyBinding,
  KeyBindingUtil,
  convertToRaw,
} from "draft-js";
import Editor from "draft-js-plugins-editor";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from "draft-js-import-html";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/DoneOutline";
import { withStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import FormatBoldIcon from "@material-ui/icons/FormatBold";
import FormatItalicIcon from "@material-ui/icons/FormatItalic";
import FormatUnderlinedIcon from "@material-ui/icons/FormatUnderlined";
import FormatQuoteIcon from "@material-ui/icons/FormatQuote";
import ImageIcon from "@material-ui/icons/Image";

import addLinkPlugin from "./addLinkPlugin";
import { mediaBlockRenderer } from "./addMediaPlugin";

import StyleButton from "./StyleButton";

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

let readOnlyState = false;

export default class DocumentTextEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createWithContent(
        stateFromHTML(this.props.html)
      ),
      html: this.props.html,
      showURLInput: false,
      showLinkInput: false,
      url: "",
      urlType: "",
      imageList: this.props.imageList,
    };
    this.plugins = [addLinkPlugin];
    this.focus = () => this.refs.editor.focus();
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(stateToHTML(content));
      console.log(convertToRaw(content));
    };
    this.onChange = (editorState) => this.setState({ editorState });
    this.onURLChange = (e) => this.setState({ urlValue: e.target.value });
    this.onTitleChange = (e) => this.setState({ urlTitle: e.target.value });
    this.onWidthChange = (e) => this.setState({ mediaWidth: e.target.value });
    this.onHeightChange = (e) => this.setState({ mediaHeight: e.target.value });
    this.onDataCaptionChange = (e) =>
      this.setState({ mediaCaption: e.target.value });
    this.onDataSourceChange = (e) =>
      this.setState({ mediaSource: e.target.value });
    this.onDataPopupChange = (e) =>
      this.setState({ mediaPopup: !this.state.mediaPopup });
    this.onBlockBackgroundChange = (e) =>
      this.setState({ blockBackground: e.target.value });
    this.onBlockDividerChange = (e) =>
      this.setState({ blockDivider: e.target.value });
    this.addAudio = this._addAudio.bind(this);
    this.addImage = this._addImage.bind(this);
    this.addVideo = this._addVideo.bind(this);
    this.addMapLink = this._addMapLink.bind(this);
    this.addDocumentLink = this._addDocumentLink.bind(this);
    this.addWebLink = this._addWebLink.bind(this);
    this.closeURLInput = this._closeURLInput.bind(this);
    this.closeLinkInput = this._closeLinkInput.bind(this);
    this.confirmMedia = this._confirmMedia.bind(this);
    this.confirmLink = this._confirmLink.bind(this);
    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.handlePastedText = this._handlePastedText.bind(this);
    this.handleReturn = this._handleReturn.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.onURLInputKeyDown = this._onURLInputKeyDown.bind(this);
    this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
  }
  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return "handled";
    }
    return "not-handled";
  }
  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }
  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }
  _confirmMedia(e) {
    e.preventDefault();
    const {
      editorState,
      urlValue,
      urlType,
      mediaWidth,
      mediaHeight,
      mediaCaption,
      mediaSource,
      mediaPopup,
    } = this.state;
    const contentState = editorState.getCurrentContent();

    const contentStateWithEntity = contentState.createEntity(
      urlType,
      "IMMUTABLE",
      {
        src: urlValue,
        width: mediaWidth,
        height: mediaHeight,
        "data-caption": mediaCaption,
        "data-source": mediaSource,
        "data-popup": mediaPopup,
      }
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.push(
      editorState,
      contentStateWithEntity,
      "create-entity"
    );
    this.setState(
      {
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          " "
        ),
        showURLInput: false,
        showLinkInput: false,
        urlValue: "",
        mediaWidth: "",
        mediaHeight: "",
        mediaCaption: "",
        mediaSource: "",
        mediaPopup: false,
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }
  _onURLInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmMedia(e);
    }
  }
  _closeURLInput() {
    this.setState(
      {
        showURLInput: false,
        showLinkInput: false,
        urlValue: "",
        mediaWidth: "",
        mediaHeight: "",
        mediaCaption: "",
        mediaSource: "",
        mediaPopup: false,
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }

  _confirmLink(e) {
    e.preventDefault();
    const { editorState, urlValue, urlType, urlTitle } = this.state;
    const data = {
      url: urlValue,
      title: urlTitle,
      type: urlType,
    };

    if (urlType === "urllink") {
      data["data-link"] = true;
    } else if (urlType === "documentlink") {
      data["data-document"] = true;
    } else if (urlType === "maplink") {
      data["data-maplink"] = true;
    }

    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      "LINK",
      "MUTABLE",
      data
    );
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.push(
      editorState,
      contentStateWithEntity,
      "create-entity"
    );
    this.setState(
      {
        editorState: AtomicBlockUtils.insertAtomicBlock(
          newEditorState,
          entityKey,
          " "
        ),
        showURLInput: false,
        showLinkInput: false,
        urlValue: "",
        urlTitle: "",
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
    return "handled";
  }

  _onLinkInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmLink(e);
    }
  }
  _closeLinkInput() {
    this.setState(
      {
        showLinkInput: false,
        urlValue: "",
        urlTitle: "",
      },
      () => {
        setTimeout(() => this.focus(), 0);
      }
    );
  }

  _handleReturn = (evt) => {
    // Handle soft break on Shift+Enter
    const blockType = RichUtils.getCurrentBlockType(this.state.editorState);
    if (evt.shiftKey) {
      this.setState({
        editorState: RichUtils.insertSoftNewline(this.state.editorState),
      });
      return "handled";
    }
    if (blockType !== "blockquote" || !KeyBindingUtil.isSoftNewlineEvent(evt)) {
      return "not_handled";
    }
    const newState = RichUtils.insertSoftNewline(this.state.editorState);
    this.onChange(newState);
    return "handled";
  };
  _promptForMedia(type) {
    this.setState(
      {
        showURLInput: true,
        showLinkInput: false,
        urlValue: this.state.urlValue,
        urlType: type,
        mediaWidth: this.state.mediaWidth,
        mediaHeight: this.state.mediaHeight,
        mediaCaption: this.state.mediaCaption,
        mediaSource: this.state.mediaSource,
        mediaPopup: this.state.mediaPopup,
      },
      () => {
        setTimeout(() => this.refs.url.focus(), 0);
      }
    );
  }
  _promptForLink(type) {
    this.setState(
      {
        showURLInput: false,
        showLinkInput: true,
        urlValue: this.state.urlValue,
        urlType: type,
        urlTitle: "",
      },
      () => {
        setTimeout(() => this.refs.link.focus(), 0);
      }
    );
  }
  _addAudio() {
    this._promptForMedia("audio");
  }
  _addImage() {
    this._promptForMedia("image");
  }
  _addVideo() {
    this._promptForMedia("video");
  }
  _addMapLink() {
    this._promptForLink("maplink");
  }
  _addDocumentLink() {
    this._promptForLink("documentlink");
  }
  _addWebLink() {
    this._promptForLink("urllink");
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
  _handlePastedText = (text = "", html) => {
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
      img.width = "";
      img.height = "";
      img["data-caption"] = "";
      img["data-source"] = "";
      //img["data-popup"] = false;
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

  createMarkup(html) {
    return {
      __html: html,
    };
  }
  getHtml() {
    const content = this.state.editorState.getCurrentContent();

    // Add custom attributes
    let options = {
      blockStyleFn: (block) => {
        if (block.get("type").toLowerCase() === "blockquote") {
          return {
            attributes: {
              "data-text-section": "",
            },
          };
        }
      },
    };
    return stateToHTML(content, options);
  }
  applyChanges() {
    console.log("Before saving", this.getHtml());
    this.props.onUpdate(this.getHtml());
    this.setState({
      //readonly: !this.state.readonly,
      html: this.getHtml(),
    });
  }

  render() {
    const { editorState, imageList } = this.state;

    let className = "RichEditor-editor";
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== "unstyled") {
        className += " RichEditor-hidePlaceholder";
      }
    }

    let urlInput;
    if (this.state.showURLInput) {
      urlInput = (
        <div style={styles.urlInputContainer}>
          <h1>Lägg till media</h1>
          <input
            onChange={this.onURLChange}
            ref="url"
            style={styles.urlInput}
            type="text"
            value={this.state.urlValue || ""}
            onKeyDown={this.onURLInputKeyDown}
          />
          <select onChange={this.onURLChange}>
            {imageList
              ? imageList.map((image, i) => {
                  return (
                    <option
                      key={i}
                      type="text"
                      name="url"
                      value={"../Upload/" + image}
                    >
                      {image}
                    </option>
                  );
                })
              : null}
          </select>
          <input
            onChange={this.onWidthChange}
            ref="width"
            type="number"
            value={this.state.mediaWidth || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="WIDTH"
          />
          <input
            onChange={this.onHeightChange}
            ref="height"
            type="number"
            value={this.state.mediaHeight || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="HEIGHT"
          />
          <input
            onChange={this.onDataCaptionChange}
            ref="data-caption"
            type="text"
            value={this.state.mediaCaption || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="DATA-CAPTION"
          />
          <input
            onChange={this.onDataSourceChange}
            ref="data-source"
            type="text"
            value={this.state.mediaSource || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="DATA-SOURCE"
          />
          <input
            id="data-popup"
            onChange={this.onDataPopupChange}
            ref="data-popup"
            type="checkbox"
            value={this.state.mediaPopup || ""}
            onKeyDown={this.onURLInputKeyDown}
            placeholder="DATA-POPUP"
          />
          <label>Popup</label>
          <button onMouseDown={this.confirmMedia}>OK</button>
          <button onMouseDown={this.closeURLInput}>Avbryt</button>
        </div>
      );
    }

    if (this.state.showLinkInput) {
      urlInput = (
        <div style={styles.urlInputContainer}>
          <h1>Lägg till länk {this.state.urlType}</h1>
          <input
            onChange={this.onURLChange}
            ref="link"
            style={styles.urlInput}
            type="text"
            value={this.state.urlValue || ""}
            placeholder="Webblänk"
            onKeyDown={this.onLinkInputKeyDown}
          />
          <input
            onChange={this.onTitleChange}
            ref="link"
            style={styles.urlInput}
            type="text"
            value={this.state.urlTitle || ""}
            placeholder="Rubrik på länk"
            onKeyDown={this.onLinkInputKeyDown}
          />
          <button onMouseDown={this.confirmLink}>OK</button>
          <button onMouseDown={this.closeLinkInput}>Avbryt</button>
        </div>
      );
    }

    return (
      <div className="RichEditor-root" style={styles.root}>
        <div style={styles.buttons}>
          <InlineStyleControls
            editorState={editorState}
            onToggle={this.toggleInlineStyle}
          />
          <BlockStyleControls
            editorState={editorState}
            onToggle={this.toggleBlockType}
          />
          <StyleButton label={<ImageIcon />} onToggle={this.addImage} />
          <button onClick={this.addWebLink}>Webblänk</button>
          <button onClick={this.addDocumentLink}>Dokumentlänk</button>
          <button onClick={this.addMapLink}>Kartlänk</button>
        </div>
        {urlInput}
        <ColorButtonGreen
          variant="contained"
          className="btn btn-primary"
          title="Godkänn ändringar"
          onClick={() => this.applyChanges()}
          startIcon={<DoneIcon />}
        >
          <span>Godkänn ändringar</span>
        </ColorButtonGreen>
        <div className={className} style={styles.editor} onClick={this.focus}>
          <Editor
            blockRendererFn={mediaBlockRenderer}
            blockStyleFn={getBlockStyle}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            handlePastedText={this.handlePastedText}
            handleReturn={this.handleReturn}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            placeholder="Lägg till text..."
            ref="editor"
            readOnly={readOnlyState}
            plugins={this.plugins}
          />
        </div>
        <input
          onClick={this.logState}
          style={styles.button}
          type="button"
          value="Log State"
        />
      </div>
    );
  }
}

/* Block types */
function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "RichEditor-blockquote";
    default:
      return null;
  }
}

const BLOCK_TYPES = [
  { label: "H1", style: "header-one" },
  { label: <FormatQuoteIcon />, style: "blockquote" },
  { label: "UL", style: "unordered-list-item" },
  { label: "OL", style: "ordered-list-item" },
];
const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="document-editor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.style}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

/* Inline styles */
const INLINE_STYLES = [
  { label: <FormatBoldIcon />, style: "BOLD" },
  { label: <FormatItalicIcon />, style: "ITALIC" },
  { label: <FormatUnderlinedIcon />, style: "UNDERLINE" },
];
const InlineStyleControls = (props) => {
  const currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div className="document-editor-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.style}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

/* CSS styling */
const styles = {
  root: {
    fontFamily: "'Georgia', serif",
    padding: 20,
    width: 1000,
  },
  buttons: {
    marginBottom: 10,
  },
  urlInputContainer: {
    marginBottom: 10,
  },
  urlInput: {
    fontFamily: "'Georgia', serif",
    marginRight: 10,
    padding: 3,
  },
  editor: {
    border: "1px solid #ccc",
    cursor: "text",
    minHeight: 80,
    padding: 10,
  },
  button: {
    marginTop: 10,
    textAlign: "center",
  },
  media: {
    whiteSpace: "initial",
  },
  paper: {
    position: "absolute",
    width: 400,
    //backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    //boxShadow: theme.shadows[5],
    //padding: theme.spacing(2, 4, 3),
  },
};
