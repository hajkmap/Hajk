import React from "react";
import ImageComponent from "./ImageComponent";

export const mediaBlockRenderer = (block, { getEditorState }) => {
  if (block.getType() === "atomic") {
    const contentState = getEditorState().getCurrentContent();
    const entity = contentState.getEntity(block.getEntityAt(0));
    const type = entity.getType().toLowerCase();

    if (type === "image") {
      return {
        component: Image,
        editable: false,
      };
    } else if (type === "video") {
      return {
        component: Video,
        editable: false,
      };
    } else if (type === "audio") {
      return {
        component: Audio,
        editable: false,
      };
    }
  }
  return null;
};

const Image = ({ block, contentState, readOnly }) => {
  const entity = contentState.getEntity(block.getEntityAt(0));
  const { src } = entity.getData();
  const data = entity.getData();
  const width = data["data-image-width"];
  const height = data["data-image-height"];
  const dataCaption = data["data-caption"];
  const dataSource = data["data-source"];
  const dataPopup = data["data-popup"];

  if (!!src) {
    return (
      <ImageComponent
        src={src}
        data-image-width={width}
        data-image-height={height}
        data-caption={dataCaption}
        data-source={dataSource}
        data-popup={dataPopup}
      />
    );
  }
};

const Video = ({ block, contentState }) => {
  const entity = contentState.getEntity(block.getEntityAt(0));
  const { src } = entity.getData();
  const data = entity.getData();
  const width = data["data-image-width"];
  const height = data["data-image-height"];

  if (!!src) {
    return <iframe src={src} width={width} height={height} />;
  }
};

const Audio = ({ block, contentState }) => {
  const entity = contentState.getEntity(block.getEntityAt(0));
  const { src } = entity.getData();

  if (!!src) {
    return <audio controls src={src} />;
  }
};
