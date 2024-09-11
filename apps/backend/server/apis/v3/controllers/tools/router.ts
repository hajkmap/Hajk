import * as express from "express";
import controller from "./controller.ts";

import restrictAdmin from "../../middlewares/restrict.admin.ts";

export default express
  .Router()
  .get("/", controller.getTools)
  .use(restrictAdmin) // JUST AN EXAMPLE TO TEST THAT RESTRICT ADMIN IS WORKING - in the future we will restrict access to certain all other methods except .get(), but for now, we test it like this
  // Try to get /api/v3/tools/layerswitcher/maps and you should fail unless your user belongs to the AD group specified in the RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS setting of .env.
  .get("/:toolName/maps", controller.getMapsWithTool);
