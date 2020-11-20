import AWS from "aws-sdk";
import fs from "fs";
import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";
import Common from "@ethereumjs/common";
import * as config from "../config";
import { nameof } from "../utils/nameof";

AWS.config.update({
  region: "eu-central-1",
});

const tableName = "contracts";
export class LockdropEthRepo {
  web3: Web3;

  constructor() {
    this.web3 = new Web3(Web3.givenProvider || config.infuraUrl);
  }

  public async deploy() {
    let abiSource = fs
      .readFileSync(config.contractAbiSource, "utf8")
      .toString();
    let codeSource = fs
      .readFileSync(config.contractCodeSource, "utf8")
      .toString();
    let abi = JSON.parse(abiSource);
    let code = "0x" + JSON.parse(codeSource)["object"];

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
      { common: new Common({ chain: "goerli" }) }
    );
    let signed = tx.sign(key);
    let stx = signed.serialize();
    let res = await this.web3.eth.sendSignedTransaction(
      "0x" + stx.toString("hex")
    );
    console.log(res);
    return res.contractAddress!;
  }
}
