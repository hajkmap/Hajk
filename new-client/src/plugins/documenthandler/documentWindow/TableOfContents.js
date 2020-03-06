import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import Collapse from "@material-ui/core/Collapse";

const styles = theme => ({
  root: {
    height: 240,
    flexGrow: 1,
    maxWidth: 400
  }
});

const chapters = [
  {
    header: "Utgångspunkter",
    link: "abc",
    chapters: [
      {
        header: "Bakgrund",
        link: "abc"
      },
      {
        header: "Utmaningar",
        link: "abc",
        chapters: [
          {
            header: "Fler utmaningar",
            link: "abc",
            chapters: [
              {
                header: "Har vi fler utmaningar?",
                link: "abc",
                chapters: [
                  {
                    header: "Jajamänsan, det har vi!",
                    link: "abc"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  { header: "Hållbar utveckling", link: "abc" }
];

class TableOfContents extends React.PureComponent {
  state = {};

  /**
   * Render all chapters of the document.
   * @param {Array} chapters An array with all chapters of the document.
   *
   * @memberof TableOfContents
   */
  renderChapters = chapters => {
    let mainChapter = 0;
    return (
      <>
        {Array.isArray(chapters)
          ? chapters.map(chapter =>
              this.renderSubChapters(chapter, 0, (++mainChapter).toString())
            )
          : null}
      </>
    );
  };

  /**
   * Private help method that recursive renders all sub chapters of a chapter.
   * @param chapter A chapter with all it's sub chapters that will be rendered.
   * @param level A recursive level that help with the table construction.
   * @param subChapterNumber A counter of the current sub chapter number
   *
   * @memberof TableOfContents
   */
  renderSubChapters = (chapter, level, subChapterNumber) => {
    let newLevel = level + 1;
    let number = 0;
    return (
      <>
        {level > 0 ? <Grid item xs={level}></Grid> : null}
        <Grid item xs={12 - level}>
          <Link href="#" underline="hover" onClick={this.linkClick}>
            {subChapterNumber + " " + chapter.header}
          </Link>
        </Grid>
        {Array.isArray(chapter.chapters)
          ? chapter.chapters.map(subChapter =>
              this.renderSubChapters(
                subChapter,
                newLevel,
                subChapterNumber.concat("." + ++number)
              )
            )
          : null}
      </>
    );
  };

  render() {
    return (
      <>
        <Typography variant="h4">Innehåll</Typography>
        <Collapse in={true}>
          <Grid container spacing={0}>
            {this.renderChapters(chapters)}
          </Grid>
        </Collapse>
      </>
    );
  }
}

export default withStyles(styles)(TableOfContents);
