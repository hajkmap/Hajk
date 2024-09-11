import AdBaseService from "./base/adbase.service.js";
import log4js from "log4js";

class AdGroupHeaderService extends AdBaseService {
  constructor() {
    super();
    this.logger2 = log4js.getLogger("service.auth.v3.adgroupheader");
  }

  init() {
    // Other overrides are located in initEnvOverrides (in AdBaseService) but this email override
    // is only applicable in the Header based AD case.
    this.overrideUserEmail = this.getEnv(
      process.env.AD_OVERRIDE_USER_EMAIL_WITH_VALUE
    );
    if (this.overrideUserEmail) {
      this.logger.warn(
        'AD_OVERRIDE_USER_EMAIL_WITH_VALUE is set in .env! Will use "%s" as email. DON\'T USE THIS IN PRODUCTION!',
        this.overrideUserEmail
      );
    }

    this.users = {};
  }

  postRequestHandler(request, user) {
    let groups = [];
    let email = "";
    if (user) {
      // Use override groups or get groups from header.
      if (this.overrideUserGroups) {
        groups = this.overrideUserGroups;
      } else {
        const xControlGroupHeader =
          process.env.AD_TRUSTED_GROUP_HEADER || "X-Control-Group-Header";
        const groupString = request.get(xControlGroupHeader);
        if (groupString) {
          groups = groupString.split(",").map((group) => group.trim());
        }
      }
      this.logger2.trace(
        "[getUserFromRequestHeader] Group Header %s has value: %o",
        process.env.AD_TRUSTED_GROUP_HEADER,
        groups
      );

      // Use override email or get email from header.
      if (this.overrideUserEmail) {
        email = this.overrideUserEmail;
      } else {
        const xControlEmailHeader =
          process.env.AD_TRUSTED_EMAIL_HEADER || "X-Control-Email-Header";
        const emailString = request.get(xControlEmailHeader);
        if (emailString) {
          email = emailString.trim();
        }
      }
    }

    // Create user if it doesn't exist
    if (user && !this.users[user]) {
      this.users[user] = {
        groups: [],
        email: "",
      };
    }

    // Set user groups and email
    this.#setUserGroups(user, groups);
    this.#setUserEmail(user, email);
  }

  #setUserGroups(userName, groups) {
    if (!this.getUser(userName)) {
      return;
    }
    this.users[userName].groups = groups;
  }

  #setUserEmail(userName, email) {
    if (!this.getUser(userName)) {
      return;
    }
    this.users[userName].email = email;
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

    return this.users[userName].groups;
  }

  getUserEmail(userName) {
    if (!this.getUser(userName)) {
      return "";
    }

    return this.users[userName].email;
  }

  async isUserValid(userName) {
    return this.getUser(userName);
  }

  async findUser(userName) {
    return this.getUser(userName) ? {} : null;
  }

  async getUserDetails(userName) {
    // This functionality is somewhat limited.
    // We only return user name, groups and email because thats all we have for now.
    return {
      user: userName,
      groups: this.getUserGroups(userName),
      mail: this.getUserEmail(userName),
    };
  }

  async getGroupMembershipForUser(userName) {
    return this.getUserGroups(userName);
  }

  async isUserMemberOf(userName, group) {
    if (this.userExists(userName)) {
      const groups = this.getUserGroups(userName) || [];
      return groups.includes(group);
    }
    return false;
  }
}

export default AdGroupHeaderService;
