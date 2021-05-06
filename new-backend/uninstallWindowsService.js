const Service = require("node-windows").Service;

// Create a new service object
const svc = new Service({
  name: "Hajk 3.6.0",
  description: "Hajk backend server",
  script: "index.js",
  nodeOptions: ["--harmony", "--max_old_space_size=4096"],
});

// Listen for the "uninstall" event so we know when it's done.
svc.on("uninstall", function () {
  console.log("Uninstall complete.");
  console.log("The service exists: ", svc.exists);
});

// Uninstall the service.
svc.uninstall();
