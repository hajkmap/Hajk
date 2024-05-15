import { Model } from "backbone";

var info = Model.extend({
  hello: function () {
    console.log("hello");
  },
});

export default info;
