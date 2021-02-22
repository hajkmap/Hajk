const { exec } = require("child_process");
const fs = require("fs");
exec("git rev-parse HEAD", (error, stdout, stderr) => {
  let envFile = fs.readFileSync(".env.local").toString();
  envFile = envFile.replace(/REACT_APP_HASH=.*/, "REACT_APP_HASH=" + stdout);
  fs.writeFileSync(".env.local", envFile);
});
