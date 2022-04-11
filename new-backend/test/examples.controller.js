import chai from "chai";
import request from "supertest";
import Server from "../server";

const expect = chai.expect;

describe("Map config", () => {
  it("should get all layers", () =>
    request(Server)
      .get("/api/v1/config/layers")
      .expect("Content-Type", /json/)
      .then((r) => {
        expect(r.body).to.be.an.an("object").that.has.property("wmslayers");
      }));

  // it("should add a new example", () =>
  //   request(Server)
  //     .post("/api/v1/examples")
  //     .send({ name: "test" })
  //     .expect("Content-Type", /json/)
  //     .then((r) => {
  //       expect(r.body)
  //         .to.be.an.an("object")
  //         .that.has.property("name")
  //         .equal("test");
  //     }));

  // it("should get an example by id", () =>
  //   request(Server)
  //     .get("/api/v1/examples/2")
  //     .expect("Content-Type", /json/)
  //     .then((r) => {
  //       expect(r.body)
  //         .to.be.an.an("object")
  //         .that.has.property("name")
  //         .equal("test");
  //     }));
});
