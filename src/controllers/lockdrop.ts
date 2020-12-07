import { Body, Controller, Get, Post, Query, Route } from "tsoa";
import * as config from "../config";
import { LockdropService } from "../services/lockdrop";

@Route("lockdrop")
export class LockdropController extends Controller {
  public lockdropService: LockdropService = new LockdropService();

  /**
   * Gets lockdrop contract info.
   */
  @Get("get")
  public async get() {
    const contract = await this.lockdropService.getContract();
    await this.lockdropService.contractGuard(contract);
    return {
      lockdropAddress: contract.address,
      mxcToken: config.mxcToken,
      iotaToken: config.iotaToken,
    };
  }

  /**
   * Deploys lock contract
   */
  @Post("lock")
  public async lock(
    @Body()
    params: {
      sender: string;
      amount: string | number;
      useValidator: boolean;
      term: number;
      dhxPublicKey: string;
      token: "mxc" | "iota";
    }
  ) {
    return await this.lockdropService.lock(
      params.sender,
      params.amount.toString(),
      params.useValidator,
      params.term,
      params.dhxPublicKey,
      params.token
    );
  }

  /**
   * Deploys signal contract
   */
  @Post("signal")
  public async signal(
    @Body()
    params: {
      amount: string | number;
      term: number;
      dhxPublicKey: string;
      token: "mxc" | "iota";
    }
  ) {
    return await this.lockdropService.signal(
      params.amount.toString(),
      params.term,
      params.dhxPublicKey,
      params.token
    );
  }

  /**
   * Get deployed claims (signals, locks) for dhx account
   */
  @Get("allClaims")
  public async allClaims(@Query() dhxPublicKey: string) {
    return await this.lockdropService.getClaims(dhxPublicKey);
  }

  /**
   * Claim lock or signal and return hash for claim tx
   */
  @Get("claim")
  public async claim(@Query() transactionHash: string) {
    return await this.lockdropService.claimLockByTransaction(transactionHash);
  }

  /**
   * Claim lock or signal and return hash for claim tx
   */
  @Get("getClaim")
  public async getClaim(@Query() transactionHash: string) {
    return await this.lockdropService.getClaimByTx(transactionHash);
  }
}
