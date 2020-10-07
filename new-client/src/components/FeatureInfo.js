import React from "react";
import ReactHtmlParser from "react-html-parser";

export default class FeatureInfo extends React.PureComponent {
  state = {
    html: null,
  };

  componentDidMount() {
    this.renderFeatureInformation().then((renderedHtml) => {
      this.setState({ html: renderedHtml });
    });
  }

  unescapeString = (strng) => {
    return strng.replace(/\\"/g, "");
  };

  createDataAttributesObjectFromEntriesArray = (entries) => {
    return entries.reduce((dataAttributeObject, entry) => {
      return {
        ...dataAttributeObject,
        ...{ [entry[0]]: this.unescapeString(entry[1]) },
      };
    }, {});
  };

  extractDataAttributes = (props) => {
    let entries = Object.entries(props).filter((entry) => {
      return entry[0].search("data-") !== -1;
    });

    return this.createDataAttributesObjectFromEntriesArray(entries);
  };

  fetchExternal = (property) => {
    if (
      this.props.globalObserver.getListeners("core.info-click").length === 0
    ) {
      return null;
    } else {
      return new Promise((resolve, reject) => {
        let dataAttributes = this.extractDataAttributes(property.props);
        //Let subscription resolve the promise
        this.props.globalObserver.publish("core.info-click", {
          payload: {
            type: property.type,
            children: property.props.children,
            dataAttributes: dataAttributes,
          },
          resolve: resolve,
        });
      });
    }
  };

  isChildTextOnly = (child) => {
    return !child.props;
  };

  nodeHasSpecialAttribute = (child) => {
    let hasSpecialAttribute = Object.keys(child.props).some((key) => {
      return key.search("data-") > -1;
    });
    return child.props && hasSpecialAttribute;
  };

  hasChildren = (child) => {
    return child.props.children && child.props.children.length > 0;
  };

  renderFeatureInformation = async () => {
    const { value } = this.props;
    const reactElementFromHtml = ReactHtmlParser(value.__html);

    const injectIfExternalComponents = async (children) => {
      for (var i = 0; i < children.length; i++) {
        if (this.isChildTextOnly(children[i])) {
          continue;
        }
        if (this.nodeHasSpecialAttribute(children[i])) {
          let externalElement = await this.fetchExternal(children[i]);
          if (externalElement) {
            children[i] = externalElement;
          }

          continue;
        }

        if (this.hasChildren(children[i])) {
          injectIfExternalComponents(children[i].props.children);
        }
      }
    };

    await injectIfExternalComponents(reactElementFromHtml[0].props.children);

    return reactElementFromHtml;
  };

  render() {
    return this.state.html;
  }
}
