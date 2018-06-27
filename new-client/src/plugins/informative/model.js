import marked from 'marked';

class InformativeModel {

  constructor(settings) {
    this.olMap = settings.map;
  }

  load(callback) {
    fetch('op.md').then(response => {
      response.text().then(text => {
        var currentIndex = -1;
        var currentLevel = -1;
        callback(
          marked.lexer(text).reduce((iterator, current, index) => {
            if (current.type === "heading") {
              if (current.depth < 2) {
                currentIndex++;
                currentLevel = -1;
                iterator[currentIndex] = {
                  name: current.text,
                  children: []
                }
              } else {
                iterator[currentIndex].children.push({
                  name: current.text,
                  elements: []
                });
                currentLevel++;
              }
            } else {
              iterator[currentIndex].children[currentLevel].elements.push({
                value: current.text
              })
            }
            return iterator;
          }, {})
        );
      })
    });
  }

}

export default InformativeModel;

