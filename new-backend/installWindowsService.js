const Service = require("node-windows").Service;

// Create a new service object
const svc = new Service({
  name: "Hajk 3.6.0",
  description: "Hajk backend server",
  script: "index.js",
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on("install", function () {
  svc.start();
});

svc.install();
