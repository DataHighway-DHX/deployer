import { expect } from "chai";
import { LockdropController } from "../../src/controllers/lockdrop";
import { LockdropContract } from "../../src/interfaces/contract";
import chaiAsPromised = require("chai-as-promised");
import chai = require("chai");

chai.use(chaiAsPromised);

describe("Lockdrop controller tests", () => {
  it("/get: when contract not deployed return 404", async () => {
    const controller = new LockdropController();

    // @ts-ignore
    controller.lockdropRepo = {
      async get(): Promise<null> {
        return null;
      },
    };

    await expect(controller.get())
      .to.eventually.be.rejected.with.property("statusCode")
      .that.equals(404);
  });

  it("/get: when contract expired return 500", async () => {
    const controller = new LockdropController();

    // @ts-ignore
    controller.lockdropRepo = {
      async get(): Promise<LockdropContract> {
        return {
          address: "someAddr",
        };
      },
    };

    // @ts-ignore
    controller.lockdropEthRepo = {
      async getEndTime(address: string): Promise<number> {
        return 1;
      },
    };

    await expect(controller.get())
      .to.eventually.be.rejected.with.property("statusCode")
      .that.equals(500);
  });

  it("/get: when contract ok return address and 200", async () => {
    const controller = new LockdropController();
    const testAddress = "someAddr";

    // @ts-ignore
    controller.lockdropRepo = {
      async get(): Promise<LockdropContract> {
        return {
          address: testAddress,
        };
      },
    };

    // @ts-ignore
    controller.lockdropEthRepo = {
      async getEndTime(address: string): Promise<number> {
        return Date.now() / 1000 + 10000;
      },
    };

    await expect(controller.get()).to.eventually.equal(testAddress);
  });
});
