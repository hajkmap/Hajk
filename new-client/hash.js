const { exec } = require("child_process");
const fs = require("fs");
const envFile = ".env.local";
const key = "REACT_APP_HASH";
const regex = new RegExp(`${key}=.*`);

exec("git rev-parse HEAD", (error, stdout, stderr) => {
  let data = fs.readFileSync(envFile, { flag: "a+" }).toString();
  if (data.indexOf(key) === -1) {
    data += (data.length > 0 ? "\n" : "") + `${key}=0`;
  }
  data = data.replace(regex, `${key}=${stdout}`);
  fs.writeFileSync(envFile, data);
});
