import React from "react";
import { KeyBindingUtil } from "draft-js";

export const LinkStrategy = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entity = character.getEntity();
    return (
      entity !== null && contentState.getEntity(entity).getType() === "LINK"
    );
  }, callback);
};

export const Link = ({ contentState, entityKey, children }) => {
  const { url, title, titleId } = contentState.getEntity(entityKey).getData();
  const entity = contentState.getEntity(entityKey);
  const data = entity.getData();

  if (data["data-document"]) {
    return (
      <a
        href={url}
        rel="noopener noreferrer"
        target="_blank"
        data-header-identifier={titleId}
        data-document
      >
        {title}
      </a>
    );
  } else if (data["data-link"]) {
    return (
      <a
        href={url}
        rel="noopener noreferrer"
        target="_blank"
        data-header-identifier={titleId}
        data-link
      >
        {title}
      </a>
    );
  } else if (data["data-maplink"]) {
    return (
      <a
        href={url}
        rel="noopener noreferrer"
        target="_blank"
        data-header-identifier={titleId}
        data-maplink
      >
        {title}
      </a>
    );
  } else {
    return (
      <a
        href={url}
        rel="noopener noreferrer"
        target="_blank"
        data-header-identifier={titleId}
      >
        {title}
      </a>
    );
  }
};

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
