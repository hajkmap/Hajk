import * as React from "react";

import { Box, Button, List, Typography } from "@mui/material";

import CallMadeIcon from "@mui/icons-material/CallMade";

export default function LayerItemInfo({ layer, app, chapters }) {
  const layerInfo = layer?.get("layerInfo") || {};

  const hasInfo = () => {
    const chaptersWithLayer = findChapters(layer?.get("name"), chapters);
    return (
      layerInfo?.infoCaption ||
      "" ||
      layerInfo?.infoUrl ||
      "" ||
      layerInfo?.infoOwner ||
      "" ||
      layerInfo?.infoText ||
      "" ||
      chaptersWithLayer.length > 0
    );
  };

  const findChapters = (id, incomingChapters) => {
    let result = [];
    if (Array.isArray(incomingChapters)) {
      result = incomingChapters.reduce((chaptersWithLayer, chapter) => {
        if (Array.isArray(chapter.layers)) {
          if (chapter.layers.some((layerId) => layerId === id)) {
            chaptersWithLayer = [...chaptersWithLayer, chapter];
          }
          if (chapter.chapters.length > 0) {
            chaptersWithLayer = [
              ...chaptersWithLayer,
              ...findChapters(id, chapter.chapters),
            ];
          }
        }
        return chaptersWithLayer;
      }, []);
    }
    return result;
  };

  const onOpenChapter = (chapter) => {
    const informativeWindow = app.windows.find(
      (window) => window.type === "informative"
    );
    informativeWindow.props.custom.open(chapter);
  };

  const renderChapterLinks = () => {
    if (chapters && chapters.length > 0) {
      let chaptersWithLayer = findChapters(this.name, chapters);
      if (chaptersWithLayer.length > 0) {
        return (
          <>
            <Typography>
              Innehåll från denna kategori finns benämnt i följande kapitel i
              översiktsplanen:
            </Typography>
            <List>
              {chaptersWithLayer.map((chapter, i) => {
                return (
                  <li key={i}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onOpenChapter(chapter)}
                    >
                      {chapter.header}
                      <CallMadeIcon sx={{ marginLeft: 1, fontSize: "16px" }} />
                    </Button>
                  </li>
                );
              })}
            </List>
          </>
        );
      } else {
        return null;
      }
    } else {
      return null;
    }
  };

  return (
    <>
      {hasInfo() ? (
        <Box>
          {/* Infotext */}
          {layerInfo.infoText && (
            <>
              <Typography variant="subtitle2">{layerInfo.infoTitle}</Typography>
              <Typography
                variant="body2"
                dangerouslySetInnerHTML={{
                  __html: layerInfo.infoText,
                }}
              ></Typography>
            </>
          )}
          {/* MetadataLink */}
          {layerInfo.infoUrl && (
            <a
              href={layerInfo.infoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {layerInfo.infoUrlText || layerInfo.infoUrl}
            </a>
          )}
          {/* Owner */}
          {layerInfo.infoOwner && (
            <Typography
              variant="body2"
              dangerouslySetInnerHTML={{ __html: layerInfo.infoOwner }}
            />
          )}
          {renderChapterLinks()}
        </Box>
      ) : (
        <Typography>Ingen information tillgänglig</Typography>
      )}
    </>
  );
}
