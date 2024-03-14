import { Model } from "backbone";

var release = Model.extend({
  hello: function () {
    console.log("hello");
  },
});

export default release;
