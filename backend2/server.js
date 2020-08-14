const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/ownLogger/log", (req, res) => {
  console.log("post", req.body);
  res.send(req.body);
});

app.listen(port, () => {
  console.log(`Example app listening at https://localhost:${port}`);
});
