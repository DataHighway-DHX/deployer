import { expect } from "chai";
import { LockdropController } from "../../src/controllers/lockdrop";
import { LockdropContract } from "../../src/interfaces/contract";
import chaiAsPromised = require("chai-as-promised");
import chai = require("chai");

chai.use(chaiAsPromised);

function lockdropGuardTest(
  methodName: string,
  fun: (c: LockdropController) => Promise<any>
) {
  it(`/${methodName}: when contract not deployed return 404`, async () => {
    const controller = new LockdropController();

    // @ts-ignore
    controller.lockdropService.lockdropStoreRepo = {
      async getContract(): Promise<null> {
        return null;
      },
    };

    await expect(fun(controller))
      .to.eventually.be.rejected.with.property("statusCode")
      .that.equals(404);
  });

  it(`/${methodName}: when contract expired return 500`, async () => {
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

    await expect(fun(controller))
      .to.eventually.be.rejected.with.property("statusCode")
      .that.equals(500);
  });
}

describe("Lockdrop controller tests", () => {
  lockdropGuardTest("get", (c) => c.get());

  it("/get: when contract ok return address and 200", async () => {
    const controller = new LockdropController();
    const testAddress = "someAddr";

    // @ts-ignore
    controller.lockdropService.lockdropStoreRepo = {
      async getContract(): Promise<LockdropContract> {
        return {
          address: testAddress,
        };
      },
    };

    // @ts-ignore
    controller.lockdropService.lockdropContractRepo = {
      async getEndTime(address: string): Promise<number> {
        return Date.now() / 1000 + 10000;
      },
    };

    await expect(controller.get())
      .to.eventually.has.property("lockdropAddress")
      .which.equals(testAddress);
  });

  lockdropGuardTest("signal", (c) => c.signal(null));
  lockdropGuardTest("lock", (c) => c.lock(null));
});
