import { Body, Controller, Get, Query, Route } from "tsoa";
import { LockdropEthRepo } from "../repositories/lockdropEthereum";
import { LockdropStoreRepo } from "../repositories/lockdropStore";

@Route("lockdrop")
export class LockdropController extends Controller {
  public lockdropRepo: LockdropStoreRepo = new LockdropStoreRepo();
  public lockdropEthRepo: LockdropEthRepo = new LockdropEthRepo();

  /*
  Gets lockdrop contract address for passed ethereum account.
  If contract doesn't exists or expired, it will be deployed.
   */
  @Get("get")
  public async get(@Query() ethereumAddress: string) {
    await this.lockdropRepo.put({
      deployedFor: ethereumAddress,
      address: "t",
      deployedTime: 0,
    });
    await this.lockdropRepo.getForAddress(ethereumAddress);
    return null;
    let address = await this.lockdropRepo.deploy();
    return address;
  }
}
