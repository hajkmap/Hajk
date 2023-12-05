import AdBaseService from "./base/adbase.service.js";
import log4js from "log4js";

class AdGroupHeaderService extends AdBaseService {
  constructor() {
    super();
    this.logger2 = log4js.getLogger("service.auth.v2.adgroupheader");
  }

  init() {
    this.users = {};
  }

  postRequestHandler(request, user) {
    const xControlGroupHeader =
      process.env.AD_TRUSTED_GROUP_HEADER || "X-Control-Group-Header";

    const groups = [];
    if (user) {
      const groupString = request.get(xControlGroupHeader);
      if (groupString) {
        groupString.split(",").forEach((group) => {
          groups.push(group.trim());
        });
      }
      this.logger2.trace(
        "[getUserFromRequestHeader] Group Header %s has value: %o",
        process.env.AD_TRUSTED_GROUP_HEADER,
        groupString
      );
    }

    this.#setUserGroups(user, groups);
  }

  #setUserGroups(userName, groups) {
    if (!this.getUser(userName)) {
      return;
    }
    this.users[userName] = groups;
  }

  validUserName(userName) {
    // Crucial to check that input is safe. Keep chars to bare minimum.
    const regex = /^[A-Za-z0-9-_]+/;
    const res = regex.exec(userName);

    if (res) {
      // Is input safe? Is the userName valid?
      return res[0] === userName && userName.trim() != "";
    }

    return false;
  }

  getUser(userName) {
    return userName && userName.trim().length > 0;
  }

  userExists(userName) {
    return this.getUser(userName) ? true : false;
  }

  getUserGroups(userName) {
    if (!this.getUser(userName)) {
      return [];
    }

    return this.users[userName];
  }

  async isUserValid(userName) {
    return this.getUser(userName);
  }

  async findUser(userName) {
    return this.getUser(userName) ? {} : null;
  }

  async getGroupMembershipForUser(userName) {
    return this.getUserGroups(userName);
  }

  async isUserMemberOf(userName, group) {
    if (this.userExists(userName)) {
      const groups = this.getUserGroups(userName);
      return groups.includes(group);
    }
    return false;
  }
}

export default AdGroupHeaderService;
