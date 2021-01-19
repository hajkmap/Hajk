import React from "react";
import PrintListItem from "./PrintListItem";
import PrintList from "./PrintList";
import Collapse from "@material-ui/core/Collapse";

class PrintSubList extends React.Component {
  state = {
    open: false,
  };

  toggleCollapseSubMenu = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    const { chapter, checked } = this.props;
    return (
      <>
        <PrintListItem
          hasSubChapters
          expandedSubChapter={this.state.open}
          checked={checked}
          toggleSubmenu={this.toggleCollapseSubMenu}
          {...this.props}
        ></PrintListItem>
        <Collapse
          aria-expanded={this.state.open}
          id="subchapters"
          in={this.state.open}
          timeout="auto"
        >
          <PrintList {...this.props} chapters={chapter.chapters}></PrintList>
        </Collapse>
      </>
    );
  }
}

export default PrintSubList;
