const { exec } = require("child_process");
const fs = require("fs");
const encLocalFile = ".env.local";

let data = fs.readFileSync(encLocalFile, { flag: "a+" }).toString();

function updateGitHash(params) {
  const key = "REACT_APP_GITHASH";
  const regex = new RegExp(`${key}=.*`);

  exec("git rev-parse HEAD", (error, stdout, stderr) => {
    if (data.indexOf(key) === -1) {
      data += `${key}=0`;
    }
    data = data.replace(regex, `${key}=${stdout}`);
    fs.writeFileSync(encLocalFile, data.trim() + "\n");
  });
}

function updateAppVersion() {
  const key = "REACT_APP_VERSION=$npm_package_version\n";
  if (data.indexOf(key) === -1) {
    data += key;
  }
}

function updateAppName() {
  const key = "REACT_APP_NAME=$npm_package_name\n";
  if (data.indexOf(key) === -1) {
    data += key;
  }
}

updateAppName();
updateAppVersion();
updateGitHash();
