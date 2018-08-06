import marked from "marked";

class InformativeModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.chapter = -1;
    this.level = 0;
  }

  asHtml(item) {
    switch (item.type) {
      case "heading":
        return `<h${item.depth}>${item.text}</h${item.depth}>`;
      case "paragraph":
        return marked(item.text);
      default:
        return item.text;
    }
  }

  createLevels(current) {
    if (current.type === "heading") {
      this.level++;
    }
    if (current.depth === 1) {
      this.level = 0;
      this.chapter++;
    }
    return {
      chapter: this.chapter,
      level: this.level,
      html: this.asHtml(current)
    };
  }

  load(callback) {
    fetch("op.md").then(response => {
      response.text().then(text => {
        //var info = marked.lexer(text).map(this.createLevels.bind(this));
        callback(marked(text));
      });
    });
  }
}

export default InformativeModel;
