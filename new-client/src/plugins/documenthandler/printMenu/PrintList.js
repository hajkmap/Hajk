import React from "react";
import List from "@material-ui/core/List";
import PrintSubList from "./PrintSubList";
import PrintListItem from "./PrintListItem";

class PrintList extends React.Component {
  renderPrintListItem = (chapter, type) => {
    const { handleCheckboxChange, localObserver } = this.props;
    return (
      <PrintListItem
        type={type}
        chapter={chapter}
        checked={chapter.chosenForPrint}
        localObserver={localObserver}
        handleCheckboxChange={handleCheckboxChange}
      ></PrintListItem>
    );
  };

  renderSubMenu = (chapter) => {
    const { handleCheckboxChange, localObserver } = this.props;
    return (
      <PrintSubList
        chapter={chapter}
        subChapters={chapter.chapters}
        checked={chapter.chosenForPrint}
        handleCheckboxChange={handleCheckboxChange}
        localObserver={localObserver}
      ></PrintSubList>
    );
  };

  getSubChapters = (chapters, headerIdentifier) => {
    return chapters.filter((chapter) => chapter.parent === headerIdentifier);
  };

  hasSubChapters = (chapter) => {
    if (Array.isArray(chapter.chapters) && chapter.chapters.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  render() {
    const { chapters } = this.props;
    return (
      <List style={{ width: "100%" }} disablePadding>
        {chapters.map((chapter, index) => {
          return (
            <React.Fragment key={index}>
              {this.hasSubChapters(chapter)
                ? this.renderSubMenu(chapter)
                : this.renderPrintListItem(chapter, "document")}
            </React.Fragment>
          );
        })}
      </List>
    );
  }
}

export default PrintList;
