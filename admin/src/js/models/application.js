
var application = Backbone.Model.extend({

  hello: function () {
    console.log("hello");
  }

});

module.exports = new application();