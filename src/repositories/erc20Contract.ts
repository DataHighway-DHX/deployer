import fs from "fs";
import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";
import Common from "@ethereumjs/common";
import * as config from "../config";
import { PromiEvent, TransactionReceipt } from "web3-core";

export class Erc20ContractRepo {
  private web3: Web3;
  private abi: any;
  private code: string;

  public readonly contractAbiSource = config.contractErc20AbiSource;
  public readonly contractCodeSource = config.contractErc20CodeSource;

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

  public async getBalance(erc20Address: string, ethereumAddress: string) {
    let abi = this.getAbi();
    let res = await new this.web3.eth.Contract(abi, erc20Address).methods
      .balanceOf(ethereumAddress)
      .call();
    return res as string;
  }
}
