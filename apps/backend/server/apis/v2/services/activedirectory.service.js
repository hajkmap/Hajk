/**
 * This service acts as a factory as there are different approaches regarding Active Directory.
 */

let importPath = "./adldap.service.js"; // The old Ldap approach is of course Default.

if (process.env.AD_USE_GROUPS_FROM_HEADER === "true") {
  importPath = "./adgroupheader.service.js";
}

const Cls = await import(importPath);
const instance = new Cls.default();
instance.init();

export default instance;
