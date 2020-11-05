import React from "react";
import { KeyBindingUtil } from "draft-js";

const LinkStrategy = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entity = character.getEntity();
    return (
      entity !== null &&
      contentState.getEntity(entity).getType().toLowerCase() === "link"
    );
  }, callback);
};

const Link = (props) => {
  const entity = props.contentState.getEntity(props.entityKey);
  const data = entity.getData();
  const title = props.decoratedText;

  if (data["data-document"]) {
    return (
      <a
        data-document={data["data-document"]}
        data-header-identifier={data["data-header-identifier"]}
        rel="noopener noreferrer"
        target="_blank"
      >
        {title}
      </a>
    );
  } else if (data["data-link"]) {
    return (
      <a
        data-link={data["data-link"]}
        data-header-identifier={data["data-header-identifier"]}
        data-title={data.title}
      >
        {title}
      </a>
    );
  } else if (data["data-maplink"]) {
    return (
      <a
        data-maplink={data["data-maplink"]}
        data-header-identifier={data["data-header-identifier"]}
        rel="noopener noreferrer"
        target="_blank"
      >
        {title}
      </a>
    );
  } else {
    return (
      <a
        data-header-identifier={data["data-header-identifier"]}
        rel="noopener noreferrer"
        target="_blank"
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
