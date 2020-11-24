import { LockdropEthRepo } from "../repositories/lockdropEthereum";
import { LockdropStoreRepo } from "../repositories/lockdropStore";
import { contractExpiredOffsetSeconds } from "../config";

export class TokenUpdater {
  private lockdropRepo: LockdropStoreRepo = new LockdropStoreRepo();
  private lockdropEthRepo: LockdropEthRepo = new LockdropEthRepo();
  private expiredOffsetSec: number;

  constructor(expiredOffsetSec: number) {
    this.expiredOffsetSec = expiredOffsetSec;
  }

  public start(periodMs: number) {
    this.tick(periodMs).then(() => console.log("first-time task resolved"));
  }

  private async tick(periodMs: number) {
    try {
      await this.updateIfRequired();
    } catch (e) {
      console.log("update problem");
      console.log(e);
    }
    setTimeout(() => this.tick(periodMs), periodMs);
  }

  public async updateIfRequired() {
    let contract = await this.lockdropRepo.get();
    let deployContract = false;
    if (!contract) {
      deployContract = true;
    } else {
      let endTime = await this.lockdropEthRepo.getEndTime(contract.address);
      if (endTime - this.expiredOffsetSec < Date.now() / 1000) {
        deployContract = true;
      }
    }

    if (!deployContract) return;

    console.log("redeploying");
    let address = await this.lockdropEthRepo.deploy();
    contract = {
      address: address,
    };
    await this.lockdropRepo.put(contract);
  }
}
