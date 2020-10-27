import db from "./examples.db.service";

class ExamplesService {
  all() {
    return db.all();
  }

  byId(id) {
    return db.byId(id);
  }

  create(name) {
    return db.insert(name);
  }
}

export default new ExamplesService();
