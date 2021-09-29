import React from "react";
import MapIcon from "@material-ui/icons/Map";
import DescriptionIcon from "@material-ui/icons/Description";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import clsx from "clsx";
import Box from "@material-ui/core/Box";
import TextArea from "../documentWindow/TextArea";
import { makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import {
  Button,
  Typography,
  CardMedia,
  List,
  ListItem,
  Grid,
} from "@material-ui/core";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

//Had to make some magic to be able to handle list in all different sizes.
//Common problem to get second row indented in a good way and even more difficult
//when you can change the font-size in theme.
const getIndentationValue = (fontSize, multiplier, negative) => {
  let value = multiplier * fontSize.substring(0, fontSize.length - 3);
  return negative ? `${value * -1}rem` : `${value}rem`;
};

const useStyles = makeStyles((theme) => ({
  documentImage: {
    objectFit: "contain",
    objectPosition: "left",
  },
  customLabel: {
    textAlign: "left",
  },
  pictureRightFloatingText: {},
  pictureLeftFloatingText: {},

  floatRight: {
    float: "right",
    marginLeft: theme.spacing(1),
  },
  floatLeft: {
    float: "left",
    marginRight: theme.spacing(1),
  },

  mediaRight: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
  },
  mediaLeft: {
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
  },
  mediaCenter: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
  },

  popupActivatedImage: {
    marginBottom: theme.spacing(1),
    cursor: "pointer",
  },
  naturalDocumentImageProportions: {
    marginTop: theme.spacing(1),
    width: "100%",
  },
  imageText: {
    marginBottom: theme.spacing(1),
  },
  imageInformationWrapper: {
    marginBottom: theme.spacing(1),
    maxWidth: "100%",
  },
  startIcon: {
    marginLeft: theme.spacing(0),
  },
  linkIcon: {
    verticalAlign: "middle",
  },
  heading: {
    marginBottom: theme.spacing(1),
  },
  media: {
    width: "auto",
    maxWidth: "100%",
  },
  listItemOneDigit: {
    marginRight: getIndentationValue(theme.typography.body1.fontSize, 1), //MAGIC
    padding: theme.spacing(0),
  },
  listItemTwoDigit: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(0),
    marginRight: getIndentationValue(theme.typography.body1.fontSize, 0.5), //MAGIC
  },
  olListItem: {
    padding: theme.spacing(0),
  },
  ulList: {
    listStyle: "initial",
    listStylePosition: "inside",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    marginBottom: theme.spacing(1),
    paddingLeft: getIndentationValue(theme.typography.body1.fontSize, 1.375), //MAGIC
    textIndent: getIndentationValue(
      theme.typography.body1.fontSize,
      1.375,
      true
    ), //MAGIC
    padding: theme.spacing(0),
  },
  olList: {
    padding: theme.spacing(0),
    marginBottom: theme.spacing(1),
  },
  bottomMargin: {
    marginBottom: theme.spacing(1),
  },
  linkButton: {
    padding: theme.spacing(0),
    color: theme.palette.info.main,
  },
  hoverLink: {
    cursor: "text",
    textDecoration: "underline dotted",
  },
}));

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

export const ULComponent = ({ ulComponent }) => {
  let children = [...ulComponent.children];
  const classes = useStyles();
  return (
    <List className={classes.ulList} component="ul">
      {children.map((listItem, index) => {
        return (
          <Typography
            key={index}
            component="li"
            className={classes.typography}
            variant="body1"
          >
            {getFormattedComponentFromTag(listItem)}{" "}
          </Typography>
        );
      })}
    </List>
  );
};

export const OLComponent = ({ olComponent }) => {
  let children = [...olComponent.children];
  const classes = useStyles();
  return (
    <List className={classes.olList} component="ol">
      {children.map((listItem, index) => {
        return (
          <ListItem className={classes.olListItem} disableGutters key={index}>
            <Grid wrap="nowrap" container>
              <Grid
                className={clsx(
                  index < 9
                    ? classes.listItemOneDigit
                    : classes.listItemTwoDigit
                )}
                item
              >
                <Typography variant="body1">{`${index + 1}.`}</Typography>
              </Grid>
              <Grid item>
                <Typography className={classes.olListItem} variant="body1">
                  {getFormattedComponentFromTag(listItem)}
                </Typography>
              </Grid>
            </Grid>
          </ListItem>
        );
      })}
    </List>
  );
};

export const Heading = ({ headingTag }) => {
  const classes = useStyles();
  return (
    <>
      <Typography
        className={classes.heading}
        variant={headingTag.tagName.toLowerCase()}
      >
        {getFormattedComponentFromTag(headingTag)}
      </Typography>
    </>
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

  return (
    <TextArea
      backgroundColor={backgroundColor}
      dividerColor={dividerColor}
      textAreaContentArray={textAreaContentArray}
    ></TextArea>
  );
};

export const BlockQuote = ({ blockQuoteTag, defaultColors }) => {
  if (blockQuoteTag.attributes.getNamedItem("data-text-section")) {
    return getTextArea(blockQuoteTag, defaultColors);
  } else {
    return null;
  }
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
export const Img = ({ imgTag, localObserver, componentId }) => {
  const classes = useStyles();
  const tagIsPresent = (imgTag, attribute) => {
    return imgTag.attributes.getNamedItem(attribute) == null ? false : true;
  };

  const getImageStyle = (image) => {
    let className = image.popup
      ? clsx(
          classes.documentImage,
          classes.naturalDocumentImageProportions,
          classes.popupActivatedImage
        )
      : clsx(classes.documentImage, classes.naturalDocumentImageProportions);

    if (image.height && image.width) {
      if (image.popup) {
        className = clsx(classes.documentImage, classes.popupActivatedImage);
      } else {
        className = clsx(classes.documentImage);
      }
    }
    return className;
  };

  const getImagePositionClass = (position) => {
    if (position === "right") {
      return classes.mediaRight;
    }

    if (position === "left") {
      return classes.mediaLeft;
    }

    if (position === "center") {
      return classes.mediaCenter;
    }

    if (position === "floatLeft") {
      return classes.floatLeft;
    }

    if (position === "floatRight") {
      return classes.floatRight;
    }

    return;
  };

  const getImageDescription = (image) => {
    return (
      <Box
        style={{ width: image.width }}
        className={classes.imageInformationWrapper}
      >
        {image.caption && (
          <Typography id={`image_${image.captionId}`} variant="subtitle2">
            {image.caption}
          </Typography>
        )}
        {image.source && (
          <Typography
            id={`image_${image.sourceId}`}
            variant="subtitle2"
            className={classes.imageText}
          >
            {image.source}
          </Typography>
        )}
      </Box>
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

  const positioningClass = getImagePositionClass(image.position);

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

  return (
    <Box
      key={`${image.id}`}
      data-position={image.position}
      className={positioningClass}
    >
      <CardMedia
        onClick={onClickCallback}
        alt={image.altValue || ""}
        classes={{ media: classes.media }}
        aria-describedby={getDescribedByAttribute()}
        component="img"
        style={
          image.height && image.width
            ? { height: image.height, width: image.width }
            : null
        }
        className={getImageStyle(image)}
        image={image.url}
      />
      {getImageDescription(image)}
    </Box>
  );
};

/**
 * The render function for hte video-tag.
 * @param {object} videoTag The video-tag.
 * @returns React.Fragment
 */
export const Video = ({ videoTag, componentId }) => {
  const videoAttributes = {
    caption: videoTag.attributes.getNamedItem("data-caption")?.value,
    height: videoTag.attributes.getNamedItem("data-video-height")?.value,
    width: videoTag.attributes.getNamedItem("data-video-width")?.value,
    position: videoTag.attributes.getNamedItem("data-video-position")?.value,
    source: videoTag.attributes.getNamedItem("data-source")?.value,
    url: videoTag.attributes.getNamedItem("src")?.value,
    id: `video_${componentId}`,
  };

  const classes = useStyles();
  const getVideoPositionClass = (position) => {
    if (position === "right") {
      return classes.mediaRight;
    }

    if (position === "left") {
      return classes.mediaLeft;
    }

    if (position === "center") {
      return classes.mediaCenter;
    }

    if (position === "floatLeft") {
      return classes.floatLeft;
    }

    if (position === "floatRight") {
      return classes.floatRight;
    }

    return;
  };
  const positioningClass = getVideoPositionClass(videoAttributes.position);

  const renderSources = (childrenSource) => {
    let arraySources = [];
    if (childrenSource.length > 0) {
      childrenSource.forEach((child, index) => {
        arraySources.push(
          <React.Fragment key={index}>{renderChild(child)}</React.Fragment>
        );
      });
    }

    return arraySources;
  };
  const childrenSource = [...videoTag.childNodes];
  const arraySources = renderSources(childrenSource);

  const getVideoDescription = (videoAttributes) => {
    return (
      <Box
        style={{ width: videoAttributes.width }}
        className={classes.imageInformationWrapper}
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
            className={classes.imageText}
          >
            {videoAttributes.source}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <React.Fragment key={videoAttributes.id}>
      <div className={positioningClass}>
        <video
          height={videoAttributes.height}
          width={videoAttributes.width}
          controls={"controls"}
        >
          {arraySources}
        </video>
        {getVideoDescription(videoAttributes)}
      </div>
    </React.Fragment>
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
 * The render function for hte abbr-tag, that renders a tooltip.
 * @param {object} abbrTag The abbr-tag.
 * @returns React.Fragment
 */
export const Hover = ({ abbrTag }) => {
  const children = [...abbrTag.childNodes];
  const hoverText = abbrTag.title;
  const classes = useStyles();
  let array = [];
  if (children.length > 0) {
    children.forEach((child, index) => {
      array.push(
        <React.Fragment key={index}>
          <Tooltip title={hoverText} placement={"bottom"}>
            <abbr className={classes.hoverLink}>{renderChild(child)}</abbr>
          </Tooltip>
        </React.Fragment>
      );
    });
    return array;
  }
  return [
    <React.Fragment key={0}>
      <Tooltip title={hoverText} placement={"bottom"}>
        <abbr className={classes.hoverLink}>{abbrTag.textContent}</abbr>
      </Tooltip>
    </React.Fragment>,
  ];
};

/**
 * Callback used to render different link-components from a-elements
 * @param {Element} aTag a-element.
 * @returns {<Link>} Returns materialUI component <Link>
 *
 * @memberof Contents
 */
export const CustomLink = ({ aTag, localObserver, bottomMargin }) => {
  const classes = useStyles();

  const getLinkDataPerType = (attributes) => {
    const {
      0: mapLink,
      1: headerIdentifier,
      2: documentLink,
      3: externalLink,
    } = [
      "data-maplink",
      "data-header-identifier",
      "data-document",
      "data-link",
    ].map((attributeKey) => {
      return attributes.getNamedItem(attributeKey)?.value;
    });

    return { mapLink, headerIdentifier, documentLink, externalLink };
  };

  const getExternalLink = (externalLink) => {
    return (
      <Button
        color="default"
        startIcon={<OpenInNewIcon className={classes.linkIcon}></OpenInNewIcon>}
        classes={{ startIcon: classes.startIcon }}
        target="_blank"
        component="a"
        className={clsx(
          bottomMargin
            ? [classes.bottomMargin, classes.linkButton]
            : classes.linkButton
        )}
        key="external-link"
        href={externalLink}
      >
        <Box component="span">{getFormattedComponentFromTag(aTag)}</Box>
      </Button>
    );
  };
  const getMapLink = (aTag, mapLinkOrg) => {
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
        color="default"
        className={clsx(
          bottomMargin
            ? [classes.bottomMargin, classes.linkButton]
            : classes.linkButton
        )}
        startIcon={<MapIcon className={classes.linkIcon}></MapIcon>}
        classes={{ startIcon: classes.startIcon, label: classes.customLabel }}
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
  const getDocumentLink = (headerIdentifier, documentLink) => {
    return (
      <Button
        color="default"
        className={clsx(
          bottomMargin
            ? [classes.bottomMargin, classes.linkButton]
            : classes.linkButton
        )}
        startIcon={
          <DescriptionIcon className={classes.linkIcon}></DescriptionIcon>
        }
        style={{ padding: 0 }}
        classes={{ startIcon: classes.startIcon }}
        href="#"
        key="document-link"
        component="button"
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

  const { mapLink, headerIdentifier, documentLink, externalLink } =
    getLinkDataPerType(aTag.attributes);

  if (documentLink) {
    return getDocumentLink(headerIdentifier, documentLink);
  }

  if (mapLink) {
    return getMapLink(aTag, mapLink, localObserver);
  }

  if (externalLink) {
    return getExternalLink(externalLink);
  }

  return null;
};
