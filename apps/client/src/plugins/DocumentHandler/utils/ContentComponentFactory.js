import React, { useState } from "react";
import MapIcon from "@mui/icons-material/Map";
import DescriptionIcon from "@mui/icons-material/Description";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import TextArea from "../documentWindow/TextArea";
import { styled } from "@mui/material/styles";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Button,
  Typography,
  CardMedia,
  List,
  ListItem,
  Grid,
} from "@mui/material";
import HajkToolTip from "components/HajkToolTip";

const StyledAccordion = styled(Accordion)(
  ({ backgroundcolor, dividercolor }) => ({
    "&:before": {
      backgroundColor: "white",
    },
    margin: "0px 0px 10px 0px",
    borderRadius: "5px",
    position: "inherit",
    backgroundColor: backgroundcolor,
    border: dividercolor && `solid 2px ${dividercolor}`,
  })
);

const StyledAccordionTypography = styled(Typography)({
  marginBottom: "0",
  fontSize: "16px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  display: "block",
});

const StyledAccordionButton = styled(Button)({
  textAlign: "inherit",
  padding: "0",
  textTransform: "inherit",
});

const StyledAccordionSummary = styled(AccordionSummary)(
  ({ expanded, dividercolor }) => ({
    width: "100%",
    transition: "opacity 0.2s ease-in-out",
    justifyContent: "space-between",
    "& .MuiAccordionSummary-content": {
      maxWidth: "90%",
    },
    opacity: expanded === "true" ? 0.6 : 1,
    padding: dividercolor && "0 15px",
  })
);

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

//Had to make some magic to be able to handle list in all different sizes.
//Common problem to get second row indented in a good way and even more difficult
//when you can change the font-size in theme.
const getIndentationValue = (fontSize, multiplier, negative) => {
  let value = multiplier * fontSize.substring(0, fontSize.length - 3);
  return negative ? `${value * -1}rem` : `${value}rem`;
};

const renderChild = (child) => {
  if (child.nodeType === TEXT_NODE) {
    return child.data;
  }

  if (child.nodeType === ELEMENT_NODE) {
    // Don't assume that callback exits
    if (typeof child.callback === "function") {
      return child.callback(child);
    } else {
      // If there's no callback, warn and render just
      // the inner text portion of Element
      console.warn(
        "Unsupported DOMElement encountered. Rendering only innerText",
        child
      );
      return child.innerText;
    }
  }
};

const getFormattedComponentFromTag = (tag) => {
  const childNodes = [...tag.childNodes];
  return childNodes.map((child, index) => {
    return <React.Fragment key={index}>{renderChild(child)}</React.Fragment>;
  });
};

export const Paragraph = ({ pTag }) => {
  return (
    <Typography variant="body1">
      {getFormattedComponentFromTag(pTag)}
    </Typography>
  );
};

const ListUlList = styled(List)(({ theme }) => ({
  listStyle: "initial",
  listStylePosition: "inside",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  marginBottom: theme.spacing(1),
  padding: theme.spacing(0),
  paddingLeft: getIndentationValue(theme.typography.body1.fontSize, 1.375),
  textIndent: getIndentationValue(theme.typography.body1.fontSize, 1.375, true),
}));

const ListItemOlListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(0),
}));

const TypographyOlListItem = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(0),
}));

const ListOlList = styled(List)(({ theme }) => ({
  padding: theme.spacing(0),
  marginBottom: theme.spacing(1),
}));

const TypographyHeading = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const TypographyImageText = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const BoxImageInformationWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  maxWidth: "100%",
}));

export const ULComponent = ({ ulComponent }) => {
  let children = [...ulComponent.children];
  return (
    <ListUlList component="ul">
      {children.map((listItem, index) => {
        return (
          <Typography key={index} component="li" variant="body1">
            {getFormattedComponentFromTag(listItem)}{" "}
          </Typography>
        );
      })}
    </ListUlList>
  );
};

export const OLComponent = ({ olComponent }) => {
  let children = [...olComponent.children];
  return (
    <ListOlList component="ol">
      {children.map((listItem, index) => {
        return (
          <ListItemOlListItem disableGutters key={index}>
            <Grid wrap="nowrap" container>
              <Grid
                item
                sx={{
                  marginRight: (theme) =>
                    getIndentationValue(
                      theme.typography.body1.fontSize,
                      index < 9 ? 1 : 0.5
                    ),
                  padding: 0,
                  marginBottom: index < 9 ? 1 : "inherit",
                }}
              >
                <Typography variant="body1">{`${index + 1}.`}</Typography>
              </Grid>
              <Grid item>
                <TypographyOlListItem variant="body1">
                  {getFormattedComponentFromTag(listItem)}
                </TypographyOlListItem>
              </Grid>
            </Grid>
          </ListItemOlListItem>
        );
      })}
    </ListOlList>
  );
};

export const Heading = ({ headingTag }) => {
  return (
    <TypographyHeading variant={headingTag.tagName.toLowerCase()}>
      {getFormattedComponentFromTag(headingTag)}
    </TypographyHeading>
  );
};

const getTextArea = (tag, defaultColors) => {
  const children = [...tag.childNodes];
  let textAreaContentArray = children.map((element, index) => {
    return <React.Fragment key={index}>{renderChild(element)}</React.Fragment>;
  });

  const backgroundColor =
    tag.attributes.getNamedItem("data-background-color")?.value ||
    defaultColors?.textAreaBackgroundColor;

  const dividerColor =
    tag.attributes.getNamedItem("data-divider-color")?.value ||
    defaultColors?.textAreaDividerColor;

  const textColor = tag.attributes.getNamedItem("data-text-color")?.value;

  return (
    <TextArea
      textColor={textColor}
      backgroundColor={backgroundColor}
      dividerColor={dividerColor}
      textAreaContentArray={textAreaContentArray}
    />
  );
};

export const BlockQuote = ({ blockQuoteTag, defaultColors }) => {
  // Grab the theme to determine current light/dark mode
  const theme = useTheme();

  //
  if (blockQuoteTag.attributes.getNamedItem("data-text-section")) {
    if (theme.palette.mode === "dark") {
      // Lets try to get a better color for the text.
      const bgColorItem = blockQuoteTag.attributes.getNamedItem(
        "data-background-color"
      );
      if (bgColorItem.value) {
        const textColor = theme.palette.getContrastText(bgColorItem.value);
        blockQuoteTag.setAttribute("data-text-color", textColor);
      }
    }
    return getTextArea(
      blockQuoteTag,
      theme.palette.mode === "light" && defaultColors, // Only supply defaultColors if we're in light mode
      false
    );
  } else {
    return null;
  }
};

const getMediaPositionStyle = (position) => {
  switch (position) {
    case "right":
      return {
        alignItems: "flex-end",
        display: "flex",
        flexDirection: "column",
      };
    case "floatRight":
      return {
        float: "right",
        marginLeft: 1,
      };
    case "left":
      return {
        alignItems: "flex-start",
        display: "flex",
        flexDirection: "column",
      };
    case "floatLeft":
      return {
        float: "left",
        marginRight: 1,
      };
    case "center":
      return {
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
      };
    default:
      return {};
  }
};

const getAccordionTextArea = (tag, defaultColors, expanded, setExpanded) => {
  const children = [...tag.childNodes];
  let textAreaContentArray = children.map((element, index) => {
    return <React.Fragment key={index}>{renderChild(element)}</React.Fragment>;
  });

  let title = tag.attributes["data-accordion-title"];
  title = title
    ? tag.attributes["data-accordion-title"].value
    : (tag.innerText || tag.textContent).substring(0, 100);

  const backgroundColor =
    tag.attributes.getNamedItem("data-background-color")?.value ||
    defaultColors?.textAreaBackgroundColor;

  const dividerColor =
    tag.attributes.getNamedItem("data-divider-color")?.value ||
    defaultColors?.textAreaBackgroundColor;

  const textColor = tag.attributes.getNamedItem("data-text-color")?.value;

  return (
    <StyledAccordion
      className="blockQuoteAccordion"
      backgroundcolor={backgroundColor}
      dividercolor={dividerColor}
      sx={{ color: textColor }}
    >
      <StyledAccordionButton color="inherit" fullWidth>
        <StyledAccordionSummary
          expandIcon={<ExpandMoreIcon />}
          expanded={expanded.toString()}
          onClick={() => setExpanded(!expanded)}
          dividercolor={dividerColor}
        >
          <StyledAccordionTypography variant="body1">
            {title}
          </StyledAccordionTypography>
        </StyledAccordionSummary>
      </StyledAccordionButton>
      <AccordionDetails>{textAreaContentArray}</AccordionDetails>
    </StyledAccordion>
  );
};

export const AccordionSection = ({ blockQuoteTag, defaultColors }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (theme.palette.mode === "dark") {
    // Lets try to get a better color for the text.
    const bgColorItem = blockQuoteTag.attributes.getNamedItem(
      "data-background-color"
    );
    if (bgColorItem.value) {
      const textColor = theme.palette.getContrastText(bgColorItem.value);
      blockQuoteTag.setAttribute("data-text-color", textColor);
    }
  }

  return getAccordionTextArea(
    blockQuoteTag,
    theme.palette.mode === "light" && defaultColors,
    expanded,
    setExpanded
  );
};

export const Figure = ({ figureTag }) => {
  const children = [...figureTag.children];
  return children.map((element, index) => {
    return (
      <React.Fragment key={index}>{element.callback(element)}</React.Fragment>
    );
  });
};

/**
 * The render function for the img-tag.
 * @param {string} imgTag The img-tag.
 *
 * @memberof Contents
 */
export const Img = ({ imgTag, localObserver, componentId, baseUrl }) => {
  const tagIsPresent = (imgTag, attribute) => {
    return imgTag.attributes.getNamedItem(attribute) == null ? false : true;
  };

  const getImageStyle = (image) => {
    if (image.height && image.width) {
      return {
        objectFit: "contain",
        objectPosition: "left",
        ...(image.popup && { marginBottom: 1, cursor: "pointer" }),
      };
    } else {
      return {
        objectFit: "contain",
        objectPosition: "left",
        marginTop: 1,
        width: "100%",
        ...(image.popup && { marginBottom: 1, cursor: "pointer" }),
      };
    }
  };

  const getImageDescription = (image) => {
    return (
      <BoxImageInformationWrapper sx={{ width: image.width }}>
        {image.caption && (
          <Typography id={`image_${image.captionId}`} variant="subtitle2">
            {image.caption}
          </Typography>
        )}
        {image.source && (
          <TypographyImageText
            id={`image_${image.sourceId}`}
            variant="subtitle2"
          >
            {image.source}
          </TypographyImageText>
        )}
      </BoxImageInformationWrapper>
    );
  };

  const image = {
    caption: imgTag.attributes.getNamedItem("data-caption")?.value,
    popup: tagIsPresent(imgTag, "data-image-popup"),
    source: imgTag.attributes.getNamedItem("data-source")?.value,
    url: imgTag.attributes.getNamedItem("src")?.value,
    altValue: imgTag.attributes.getNamedItem("alt")?.value,
    height: imgTag.attributes.getNamedItem("data-image-height")?.value,
    width: imgTag.attributes.getNamedItem("data-image-width")?.value,
    position: imgTag.attributes.getNamedItem("data-image-position")?.value,
    id: `image_${componentId}`,
    captionId: `imagecaption_${componentId}`,
    sourceId: `imagesource_${componentId}`,
  };

  let onClickCallback = image.popup
    ? () => {
        localObserver.publish("image-popup", image);
      }
    : null;

  const getDescribedByAttribute = () => {
    let describedBy = [];
    if (image.caption) {
      describedBy.push(`${image.captionId}`);
    }
    if (image.source) {
      describedBy.push(`${image.sourceId}`);
    }
    return describedBy.length > 0 ? describedBy.join(" ") : null;
  };

  let imgUrl = image.url;
  if (imgUrl.includes("../")) {
    imgUrl = image.url.replace("../", baseUrl);
  }

  return (
    <Box
      key={`${image.id}`}
      data-position={image.position}
      sx={getMediaPositionStyle(image.position)}
    >
      <CardMedia
        onClick={onClickCallback}
        alt={image.altValue || ""}
        aria-describedby={getDescribedByAttribute()}
        component="img"
        image={imgUrl}
        sx={{
          ...getImageStyle(image),
          ...(image.height &&
            image.width && {
              height: image.height,
              width: image.width,
            }),
          ".MuiCardMedia-media": {
            width: "auto",
            maxWidth: "100%",
          },
        }}
      />
      {getImageDescription(image)}
    </Box>
  );
};

/**
 * The render function for the video-tag as an img-tag.
 * @param {object} imgTag The video-tag as an img-tag.
 * @returns React.Fragment
 */
export const Video = ({ imgTag, componentId, baseUrl }) => {
  const videoAttributes = {
    caption: imgTag.dataset.caption,
    height: imgTag.dataset.imageHeight,
    width: imgTag.dataset.imageWidth,
    position: imgTag.dataset.imagePosition,
    source: imgTag.dataset.source,
    url: imgTag.src,
    id: `video_${componentId}`,
  };

  const getVideoDescription = (videoAttributes) => {
    return (
      <Box
        sx={{
          width: videoAttributes.width,
          marginBottom: 1,
          maxWidth: "100%",
        }}
      >
        {videoAttributes.caption && (
          <Typography
            id={`video_${videoAttributes.captionId}`}
            variant="subtitle2"
          >
            {videoAttributes.caption}
          </Typography>
        )}
        {videoAttributes.source && (
          <Typography
            id={`video_${videoAttributes.sourceId}`}
            variant="subtitle2"
            sx={{ marginBottom: 1 }}
          >
            {videoAttributes.source}
          </Typography>
        )}
      </Box>
    );
  };

  let videoUrl = videoAttributes.url;
  if (videoUrl.includes("../")) {
    videoUrl = videoAttributes.url.replace("../", baseUrl);
  }

  return (
    <React.Fragment key={videoAttributes.id}>
      <Box sx={getMediaPositionStyle(videoAttributes.position)}>
        <video
          height={videoAttributes.height}
          width={videoAttributes.width}
          controls={"controls"}
        >
          <source src={videoUrl} type="video/mp4"></source>
        </video>
        {getVideoDescription(videoAttributes)}
      </Box>
    </React.Fragment>
  );
};

/**
 * The render function for the audio-tag as an img-tag.
 * @param {object} imgTag The audio-tag as an img-tag.
 * @returns React.Fragment
 */
export const Audio = ({ imgTag, componentId, baseUrl }) => {
  const audioAttributes = {
    caption: imgTag.attributes.getNamedItem("data-caption")?.value,
    position: imgTag.attributes.getNamedItem("data-image-position")?.value,
    source: imgTag.attributes.getNamedItem("data-source")?.value,
    url: imgTag.attributes.getNamedItem("src")?.value,
    width: imgTag.attributes.getNamedItem("data-image-width")?.value,
    id: `audio_${componentId}`,
  };

  const getAudioDescription = (audioAttributes) => {
    return (
      <Box
        sx={{
          width: audioAttributes.width,
          marginBottom: 1,
          maxWidth: "100%",
        }}
      >
        {audioAttributes.caption && (
          <Typography
            id={`video_${audioAttributes.captionId}`}
            variant="subtitle2"
          >
            {audioAttributes.caption}
          </Typography>
        )}
        {audioAttributes.source && (
          <Typography
            id={`video_${audioAttributes.sourceId}`}
            variant="subtitle2"
            sx={{ marginBottom: 1 }}
          >
            {audioAttributes.source}
          </Typography>
        )}
      </Box>
    );
  };

  let audioUrl = audioAttributes.url;
  if (audioUrl.includes("../")) {
    audioUrl = audioAttributes.url.replace("../", baseUrl);
  }

  return (
    <Box
      key={audioAttributes.id}
      sx={this.getMediaPositionStyle(audioAttributes.position)}
    >
      <audio controls={"controls"}>
        <source src={imgTag.src} type="audio/mpeg"></source>
      </audio>
      {getAudioDescription(audioAttributes)}
    </Box>
  );
};

/**
 * The render function for the source-tag.
 * @param {object} sourceTag The source-tag.
 * @returns React.Fragment
 */
export const Source = ({ sourceTag }) => {
  const children = [...sourceTag.childNodes];
  const src = sourceTag.src;
  const type = sourceTag.type;
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <source src={src} type={type}></source>
        </React.Fragment>
      );
    });
    return array;
  }
  return [
    <React.Fragment key={0}>
      <source src={src} type={type}></source>
    </React.Fragment>,
  ];
};

export const Strong = ({ strongTag }) => {
  const children = [...strongTag.childNodes];
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <strong key={index}>{renderChild(child)}</strong>
        </React.Fragment>
      );
    });
    return array;
  }
  return [
    <React.Fragment key={0}>
      <strong>{strongTag.textContent}</strong>
    </React.Fragment>,
  ];
};

export const Underline = ({ uTag }) => {
  const children = [...uTag.childNodes];
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <u>{renderChild(child)}</u>
        </React.Fragment>
      );
    });
    return array;
  }
  return [
    <React.Fragment key={0}>
      <u>{uTag.textContent}</u>
    </React.Fragment>,
  ];
};
export const Italic = ({ emTag }) => {
  const children = [...emTag.childNodes];
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <em>{renderChild(child)}</em>
        </React.Fragment>
      );
    });
    return array;
  }
  return [
    <React.Fragment key={0}>
      <em>{emTag.textContent}</em>
    </React.Fragment>,
  ];
};

/**
 * The render function for the br-tag.
 * @param {string} brTag The br-tag.
 *
 * @memberof htmlToMaterialUiParser
 */
export const LineBreak = () => {
  return <br />;
};

/**
 * Callback used to render different link-components from a-elements
 * @param {Element} aTag a-element.
 * @returns {<Link>} Returns materialUI component <Link>
 *
 * @memberof Contents
 */
export const CustomLink = ({ aTag, localObserver, bottomMargin }) => {
  const getLinkDataPerType = (attributes) => {
    const {
      0: mapLink,
      1: headerIdentifier,
      2: documentLink,
      3: externalLink,
      4: hoverLink,
    } = [
      "data-maplink",
      "data-header-identifier",
      "data-document",
      "data-link",
      "data-hover",
    ].map((attributeKey) => {
      return attributes.getNamedItem(attributeKey)?.value;
    });

    return { mapLink, headerIdentifier, documentLink, externalLink, hoverLink };
  };

  const HoverLink = ({ hoverLink, tagText }) => {
    return (
      <HajkToolTip title={hoverLink}>
        <abbr
          style={{
            cursor: "text",
            textDecoration: "underline dotted",
          }}
        >
          {tagText}
        </abbr>
      </HajkToolTip>
    );
  };

  const ExternalLink = ({ externalLink }) => {
    // Grab the theme to determine current light/dark mode
    const theme = useTheme();

    return (
      <Button
        startIcon={
          <OpenInNewIcon
            sx={{
              verticalAlign: "middle",
            }}
          />
        }
        sx={{
          padding: 0,
          color:
            theme.palette.mode === "dark"
              ? theme.palette.info.dark
              : theme.palette.info.main,
          ".MuiButton-startIcon": {
            marginLeft: 0,
          },
          ...(bottomMargin && { marginBottom: 1 }),
        }}
        target="_blank"
        component="a"
        key="external-link"
        href={externalLink}
      >
        <Box component="span">{getFormattedComponentFromTag(aTag)}</Box>
      </Button>
    );
  };

  const MapLink = ({ aTag, mapLinkOrg, localObserver }) => {
    // Grab the theme to determine current light/dark mode
    const theme = useTheme();

    // Attempt to safely URI Decode the supplied string. If
    // it fails, use it as-is.
    // The reason we want probably want to decode is that the
    // link is created using the Anchor plugin, which encodes
    // the query string properly, see #831 and #838.
    let mapLink = null;
    try {
      mapLink = decodeURIComponent(mapLinkOrg);
    } catch (error) {
      mapLink = mapLinkOrg;
    }

    return (
      <Button
        startIcon={
          <MapIcon
            sx={{
              verticalAlign: "middle",
            }}
          />
        }
        sx={{
          padding: 0,
          color:
            theme.palette.mode === "dark"
              ? theme.palette.info.dark
              : theme.palette.info.main,
          ...(bottomMargin && { marginBottom: 1 }),
          ".MuiButton-startIcon": {
            marginLeft: 0,
          },
        }}
        target="_blank"
        href={externalLink}
        key="map-link"
        component="button"
        onClick={() => {
          localObserver.publish("document-maplink-clicked", mapLink);
        }}
      >
        <Box component="span">{getFormattedComponentFromTag(aTag)}</Box>
      </Button>
    );
  };

  const DocumentLink = ({ headerIdentifier, documentLink, isPrintMode }) => {
    // Grab the theme to determine current light/dark mode
    const theme = useTheme();

    return (
      <Button
        startIcon={
          <DescriptionIcon
            sx={{
              verticalAlign: "middle",
            }}
          />
        }
        sx={{
          padding: 0,
          color:
            theme.palette.mode === "dark"
              ? theme.palette.info.dark
              : theme.palette.info.main,
          ".MuiButton-startIcon": {
            marginLeft: 0,
          },
          ...(bottomMargin && { marginBottom: 1 }),
        }}
        key="document-link"
        component={isPrintMode ? "span" : "a"}
        underline="hover"
        onClick={() => {
          localObserver.publish("document-link-clicked", {
            documentName: documentLink,
            headerIdentifier: headerIdentifier,
          });
        }}
      >
        <Box component="span">{getFormattedComponentFromTag(aTag)}</Box>
      </Button>
    );
  };

  const { mapLink, headerIdentifier, documentLink, externalLink, hoverLink } =
    getLinkDataPerType(aTag.attributes);

  if (documentLink) {
    const isPrintMode = Boolean(aTag.attributes.printMode);
    return (
      <DocumentLink
        headerIdentifier={headerIdentifier}
        documentLink={documentLink}
        isPrintMode={isPrintMode}
      />
    );
  }

  if (mapLink) {
    return (
      <MapLink aTag={aTag} mapLinkOrg={mapLink} localObserver={localObserver} />
    );
  }

  if (externalLink) {
    return <ExternalLink externalLink={externalLink} />;
  }

  if (hoverLink) {
    const tagText = aTag.text;
    return <HoverLink hoverLink={hoverLink} tagText={tagText} />;
  }

  // If we got this far it seems that _we've been trying to parse an A tag that didn't
  // have any of the data-* attributes_. One possible reason why this has happened is that
  // some mobile browsers (iOS on Safari…) auto-creates A tags from number sequencies, as
  // it thinks that the number is a phone number. We don't want this to happen, but we
  // don't want to lose the number sequence either. So we must parse this auto-inserted
  // A tag. See also #1098 for details.
  if (aTag.href?.startsWith("tel:")) {
    return getFormattedComponentFromTag(aTag);
  }

  return null;
};
