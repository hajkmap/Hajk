export const splitAndTrimOnCommas = (searchString) => {
  return searchString.split(",").map((string) => {
    return string.trim();
  });
};

export const getStringArray = (searchString) => {
  let tempStringArray = splitAndTrimOnCommas(searchString);
  return tempStringArray.join(" ").split(" ");
};

export const hasSubMenu = (item) => {
  return item.menu && item.menu.length > 0;
};

export const flattenChaptersTree = (chapters) => {
  return chapters.reduce((acc, chapter) => {
    // if (!chapter.html) {
    //   debugger;
    // }
    if (chapter.header) {
      let chapterStrippedFromSubChapters = { ...chapter };
      chapterStrippedFromSubChapters.chapters = [];
      acc = [...acc, chapterStrippedFromSubChapters];
    }
    // if (!chapter.html && chapter.header) {
    //   acc = [
    //     ...acc,
    //     {
    //       mustReplace: true,
    //       headerIdentifier: chapter.headerIdentifier,
    //       header: chapter.header,
    //     },
    //   ];
    // }
    if (chapter.chapters && chapter.chapters.length > 0) {
      return [...acc, ...flattenChaptersTree(chapter.chapters)];
    }
    return acc;
  }, []);
};
