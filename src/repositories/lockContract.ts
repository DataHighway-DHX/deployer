import fs from "fs";
import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";
import Common from "@ethereumjs/common";
import * as config from "../config";
import { PromiEvent, TransactionReceipt } from "web3-core";

export class LockContractRepo {
  private web3: Web3;
  private abi: any;
  private code: string;

  public readonly contractAbiSource = config.contractLockAbiSource;
  public readonly contractCodeSource = config.contractLockCodeSource;

  constructor() {
    this.web3 = new Web3(Web3.givenProvider || config.infuraUrl);
  }

  public getAbi() {
    if (this.abi) return this.abi;
    let abiSource = fs.readFileSync(this.contractAbiSource, "utf8").toString();
    this.abi = JSON.parse(abiSource);
    return this.abi;
  }

  public getCode() {
    if (this.code) return this.code;
    let codeSource = fs
      .readFileSync(this.contractCodeSource, "utf8")
      .toString();
    this.code = "0x" + JSON.parse(codeSource)["object"];
    return this.code;
  }

  public async getInfo(lockAddress: string) {
    let abi = this.getAbi();
    let res = await new this.web3.eth.Contract(abi, lockAddress).methods
      .info()
      .call();
    const unlockTimeUtc = Number.parseInt(res[4]);
    const date = new Date(unlockTimeUtc * 1000);
    return {
      tokenAddress: res[3] as string,
      unlockTime: date,
    };
  }
}
