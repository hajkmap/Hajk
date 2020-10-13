import React from "react";
import { RichUtils, KeyBindingUtil, EditorState } from "draft-js";

export const LinkStrategy = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entity = character.getEntity();
    return (
      entity !== null && contentState.getEntity(entity).getType() === "LINK"
    );
  }, callback);
};

export const Link = ({ contentState, entityKey, children }) => {
  const { url, title, type } = contentState.getEntity(entityKey).getData();

  const entity = contentState.getEntity(entityKey);
  const data = entity.getData();

  const dataCaption = data["data-document"];

  if (data["data-document"]) {
    console.log("Document");
  } else if (data["data-link"]) {
    console.log("URL");
  } else if (data["data-maplink"]) {
    console.log("Maplink");
  }

  return (
    <a href={url} rel="noopener noreferrer" target="_blank" data-document>
      {title}
    </a>
  );
};

const isUrl = (link) => {
  if (!link) {
    return false;
  }

  const expression = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm;
  var regex = new RegExp(expression);

  return link.match(regex);
};

const withHttps = (url) =>
  !/^https?:\/\//i.test(url) ? `https://${url}` : url;

export const addLinkPlugin = {
  keyBindingFn(event, { getEditorState }) {
    const editorState = getEditorState();
    const selection = editorState.getSelection();
    if (selection.isCollapsed()) {
      return;
    }

    if (KeyBindingUtil.hasCommandModifier(event) && event.which === 75) {
      return "add-link";
    }
  },

  decorators: [
    {
      strategy: LinkStrategy,
      component: Link,
    },
  ],
};

export default addLinkPlugin;
