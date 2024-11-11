import { Model } from "backbone";

var application = Model.extend({
  hello: function () {
    console.log("hello");
  },
});

export default application;
