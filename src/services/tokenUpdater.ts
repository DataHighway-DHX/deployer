import { LockdropEthRepo } from "../repositories/lockdropEthereum";
import { LockdropStoreRepo } from "../repositories/lockdropStore";

export class TokenUpdater {
  private lockdropRepo: LockdropStoreRepo = new LockdropStoreRepo();
  private lockdropEthRepo: LockdropEthRepo = new LockdropEthRepo();

  public start() {
    this.tick().then(() => console.log("first-time task resolved"));
  }

  private async tick() {
    try {
      await this.updateIfRequired();
    } catch (e) {
      console.log("update problem");
      console.log(e);
    }
    setTimeout(() => this.tick(), 1000 * 60 * 60);
  }

  public async updateIfRequired() {
    let contract = await this.lockdropRepo.get();
    let deployContract = false;
    if (!contract) {
      deployContract = true;
    }
    if (contract) {
      let endTime = await this.lockdropEthRepo.getEndTime(contract.address);
      if (endTime - 60 * 60 * 24 < Date.now() / 1000) {
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
