import fs from "fs";
import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";
import Common from "@ethereumjs/common";
import * as config from "../config";

export class LockdropEthRepo {
  private web3: Web3;
  private abi: any;
  private code: string;

  constructor() {
    this.web3 = new Web3(Web3.givenProvider || config.infuraUrl);
  }

  public getAbi() {
    if (this.abi) return this.abi;
    let abiSource = fs
      .readFileSync(config.contractAbiSource, "utf8")
      .toString();
    this.abi = JSON.parse(abiSource);
    return this.abi;
  }

  public getCode() {
    if (this.code) return this.code;
    let codeSource = fs
      .readFileSync(config.contractCodeSource, "utf8")
      .toString();
    this.code = "0x" + JSON.parse(codeSource)["object"];
    return this.code;
  }

  public async getEndTime(address: string) {
    let abi = this.getAbi();
    let contract = new this.web3.eth.Contract(abi, address);
    let res = (await contract.methods
      .LOCK_END_TIME()
      .call({ from: config.ethereumAccountAddress })) as string;
    return Number.parseInt(res);
  }

  public async deploy() {
    let abi = this.getAbi();
    let code = this.getCode();

    let account = config.ethereumAccountAddress;
    let key = Buffer.from(config.ethereumAccountPrivateKey, "hex");

    let nonce = await this.web3.eth.getTransactionCount(account, "pending");

    let txx = new this.web3.eth.Contract(abi).deploy({
      data: code,
      arguments: [Math.round(Date.now() / 1000)],
    });

    let tx = Transaction.fromTxData(
      {
        data: txx.encodeABI(),
        gasPrice: this.web3.utils.toHex(await txx.estimateGas()),
        gasLimit: this.web3.utils.toHex(config.gasLimit),
        nonce: nonce,
      },
      { common: new Common({ chain: config.chainType }) }
    );
    let signed = tx.sign(key);
    let stx = signed.serialize();
    console.log("sending tx");
    let res = await this.web3.eth.sendSignedTransaction(
      "0x" + stx.toString("hex")
    );
    return res.contractAddress!;
  }
}
