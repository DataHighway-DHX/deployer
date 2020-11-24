import { expect } from "chai";
import { LockdropController } from "../../src/controllers/lockdrop";
import { LockdropContract } from "../../src/interfaces/contract";
import chaiAsPromised = require("chai-as-promised");
import chai = require("chai");
import { TokenUpdater } from "../../src/services/tokenUpdater";

chai.use(chaiAsPromised);

describe("Token updater service tests", () => {
  it("/tick: invokes updateIfRequired regularly", (done) => {
    const service = new TokenUpdater(0);
    let counter = 0;
    service.updateIfRequired = async () => {
      counter++;
    };
    service.start(100);

    setTimeout(function () {
      expect(counter).eq(4);
      done();
    }, 360);
  });

  it("/updateIfRequired: when contract not deployed - deploy and put into db", (done) => {
    const service = new TokenUpdater(0);
    const deployAddress = "deployAddress";

    // @ts-ignore
    service.lockdropRepo = {
      async get(): Promise<null> {
        return null;
      },
      async put(contract: LockdropContract): Promise<void> {
        expect(contract.address).eq(deployAddress);
        done();
      },
    };

    // @ts-ignore
    service.lockdropEthRepo = {
      async deploy(): Promise<string> {
        return deployAddress;
      },
    };

    service.updateIfRequired();
  });

  it("/updateIfRequired: when contract expired - deploy and put into db", (done) => {
    const service = new TokenUpdater(0);
    const oldAddress = "oldAddress";
    const deployAddress = "deployAddress";

    // @ts-ignore
    service.lockdropRepo = {
      async get(): Promise<LockdropContract> {
        return { address: oldAddress };
      },
      async put(contract: LockdropContract): Promise<void> {
        expect(contract.address).eq(deployAddress);
        done();
      },
    };

    // @ts-ignore
    service.lockdropEthRepo = {
      async deploy(): Promise<string> {
        return deployAddress;
      },
      async getEndTime(address: string): Promise<number> {
        return Date.now() / 1000 - 1000;
      },
    };

    service.updateIfRequired();
  });

  it("/updateIfRequired: when contract is going to expire soon - deploy and put into db", (done) => {
    const expiredOffsetSec = 10000;
    const actualExpiredOffsetSec = 5000;

    const service = new TokenUpdater(expiredOffsetSec);
    const oldAddress = "oldAddress";
    const deployAddress = "deployAddress";

    // @ts-ignore
    service.lockdropRepo = {
      async get(): Promise<LockdropContract> {
        return { address: oldAddress };
      },
      async put(contract: LockdropContract): Promise<void> {
        expect(contract.address).eq(deployAddress);
        done();
      },
    };

    // @ts-ignore
    service.lockdropEthRepo = {
      async deploy(): Promise<string> {
        return deployAddress;
      },
      async getEndTime(address: string): Promise<number> {
        return Date.now() / 1000 + actualExpiredOffsetSec;
      },
    };

    service.updateIfRequired();
  });

  it("/updateIfRequired: when contract ok - do nothing", async () => {
    const expiredOffsetSec = 100;
    const service = new TokenUpdater(expiredOffsetSec);
    const oldAddress = "oldAddress";
    const deployAddress = "deployAddress";

    // @ts-ignore
    service.lockdropRepo = {
      async get(): Promise<LockdropContract> {
        return { address: oldAddress };
      },
      async put(contract: LockdropContract): Promise<void> {
        expect.fail("put fun should not be called");
      },
    };

    // @ts-ignore
    service.lockdropEthRepo = {
      async deploy(): Promise<string> {
        expect.fail("deploy fun should not be called");
      },
      async getEndTime(address: string): Promise<number> {
        return Date.now() / 1000 + expiredOffsetSec + 200;
      },
    };

    await service.updateIfRequired();
  });
});
