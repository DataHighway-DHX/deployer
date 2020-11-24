import { Body, Controller, Get, Query, Route } from "tsoa";
import { LockdropEthRepo } from "../repositories/lockdropEthereum";
import { LockdropStoreRepo } from "../repositories/lockdropStore";
import { ApiError } from "../apiError";

@Route("lockdrop")
export class LockdropController extends Controller {
  public lockdropRepo: LockdropStoreRepo = new LockdropStoreRepo();
  public lockdropEthRepo: LockdropEthRepo = new LockdropEthRepo();

  /*
  Gets lockdrop contract address.
   */
  @Get("get")
  public async get() {
    let contract = await this.lockdropRepo.get();
    if (!contract) {
      throw new ApiError(
        "ContractNotDeployed",
        404,
        "Contract not deployed. Wait"
      );
    }

    let endTime = await this.lockdropEthRepo.getEndTime(contract.address);
    if (endTime < Date.now() / 1000) {
      return new ApiError(
        "ContractExpired",
        500,
        "Contract expired. Contact administrator"
      );
    }

    return contract.address;
  }
}
