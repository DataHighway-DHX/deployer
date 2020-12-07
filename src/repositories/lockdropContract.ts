import fs from "fs";
import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";
import Common from "@ethereumjs/common";
import * as config from "../config";
import { PromiEvent, TransactionReceipt, Transaction as Tx } from "web3-core";

type RejectHandler = (e: any) => any;

class EthereumInvoke {
  private readonly event: PromiEvent<TransactionReceipt>;
  private readonly onReject: RejectHandler | null;

  constructor(
    event: PromiEvent<TransactionReceipt>,
    onReject: RejectHandler = null
  ) {
    this.event = event;
    this.onReject = onReject;
  }

  public waitHash(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.event
        .once("transactionHash", (hash) => {
          resolve(hash);
        })
        .catch((e) => {
          if (this.onReject) {
            const newError = this.onReject(e);
            reject(newError);
          } else {
            reject(e);
          }
        });
    });
  }

  public async waitResult() {
    try {
      return await this.event;
    } catch (e) {
      if (this.onReject) {
        throw this.onReject(e);
      }
      throw e;
    }
  }
}

export interface Erc20Transaction {
  tx: Tx;
  tokenAddress: string;
  amount: string;
  recipient: string;
}
export interface LockWalletStruct {
  totalAmount: string;
  lockAddress: string;
  useValidator: boolean;
  term: number;
  pendingAmount: string;
  approveAmount: string;
  claimStatus: "pending" | "finalized";
  dataHighwayPublicKey: string;
  createdAt: Date;
}

export class LockdropContractRepo {
  private web3: Web3;
  private abi: any;
  private code: string;

  public readonly ercSendMethodId = config.ercSendMethodId;
  public readonly contractAbiSource = config.contractLockdropAbiSource;
  public readonly contractCodeSource = config.contractLockdropCodeSource;
  public readonly ethereumAccountAddress = config.ethereumAccountAddress;
  public readonly ethereumAccountPrivateKey = config.ethereumAccountPrivateKey;
  public readonly gasFeeWei = config.gasFeeWei;
  public readonly gasLimit = config.gasLimit;
  public readonly chainType = config.chainType;

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

  public async getEndTime(address: string) {
    let abi = this.getAbi();
    let contract = new this.web3.eth.Contract(abi, address);
    let res = (await contract.methods
      .LOCK_END_TIME()
      .call({ from: this.ethereumAccountAddress })) as string;
    return Number.parseInt(res);
  }

  public formatDhxPublicKey(dhxPublicKey: string) {
    if (!dhxPublicKey.startsWith("0x")) {
      return this.web3.utils.fromAscii(dhxPublicKey);
    }
    return dhxPublicKey;
  }

  public async constructSignedTransactionData(txx: any, to?: string) {
    let key = Buffer.from(this.ethereumAccountPrivateKey, "hex");
    let nonce = await this.web3.eth.getTransactionCount(
      this.ethereumAccountAddress,
      "pending"
    );
    let fee: bigint = BigInt(this.gasFeeWei);
    let estimate: bigint = BigInt(await txx.estimateGas());
    let gasPrice = (fee + estimate).toString();
    let tx = Transaction.fromTxData(
      {
        data: txx.encodeABI(),
        gasPrice: this.web3.utils.toHex(gasPrice),
        gasLimit: this.web3.utils.toHex(this.gasLimit),
        nonce: nonce,
        to: to,
      },
      { common: new Common({ chain: this.chainType }) }
    );
    let signed = tx.sign(key);
    let stx = signed.serialize();
    return "0x" + stx.toString("hex");
  }

  public async sendTransactionSigned(
    txx: any,
    to?: string,
    onReject: RejectHandler = null
  ) {
    const data = await this.constructSignedTransactionData(txx, to);
    const event = this.web3.eth.sendSignedTransaction(data);
    return new EthereumInvoke(event, onReject);
  }

  public async deploy() {
    let abi = this.getAbi();
    let code = this.getCode();

    let txx = new this.web3.eth.Contract(abi).deploy({
      data: code,
      arguments: [Math.round(Date.now() / 1000)],
    });

    const event = await this.sendTransactionSigned(txx);
    const res = await event.waitResult();
    return res.contractAddress!;
  }

  public async lock(
    lockdropAddress: string,
    sender: string,
    amount: string,
    useValidator: boolean,
    term: number,
    dhxPublicKey: string,
    tokenAddress: string
  ) {
    let abi = this.getAbi();

    let txx = new this.web3.eth.Contract(abi, lockdropAddress).methods.lock(
      sender,
      term,
      amount,
      this.formatDhxPublicKey(dhxPublicKey),
      tokenAddress,
      useValidator
    );

    return await this.sendTransactionSigned(txx, lockdropAddress, (e) => {
      if (e.code === "INVALID_ARGUMENT") {
        let argument = null;
        switch (e.argument) {
          case "_lockContractOwner":
            argument = "sender";
            break;
          case "_term":
            argument = "term";
            break;
          case "_tokenERC20Amount":
            argument = "amount";
            break;
          case "_dataHighwayPublicKey":
            argument = "dhxPublicKey";
            break;
          case "_tokenContractAddress":
            argument = "tokenAddress";
            break;
          case "_isValidator":
            argument = "useValidator";
            break;
        }
        return {
          public: true,
          code: "InvalidArgument",
          message: argument
            ? `Invalid argument passed for ${argument}`
            : "Invalid argument was passed. Check input",
        };
      }
      return e;
    });
  }

  public async signal(
    lockdropAddress: string,
    amount: string,
    term: number,
    dhxPublicKey: string,
    tokenAddress: string
  ) {
    let abi = this.getAbi();

    let txx = new this.web3.eth.Contract(abi, lockdropAddress).methods.signal(
      term,
      amount,
      this.formatDhxPublicKey(dhxPublicKey),
      tokenAddress
    );

    return await this.sendTransactionSigned(txx, lockdropAddress, (e) => {
      if (e.code === "INVALID_ARGUMENT") {
        let argument = null;
        switch (e.argument) {
          case "_term":
            argument = "term";
            break;
          case "_tokenERC20Amount":
            argument = "amount";
            break;
          case "_dataHighwayPublicKey":
            argument = "dhxPublicKey";
            break;
          case "_tokenContractAddress":
            argument = "tokenAddress";
            break;
        }
        return {
          public: true,
          code: "InvalidArgument",
          message: argument
            ? `Invalid argument passed for ${argument}`
            : "Invalid argument was passed. Check input",
        };
      }
      return e;
    });
  }

  private trimZeroLeft(source: string) {
    return source.replace(/^0+|/g, "");
  }

  public async getERC20SendTx(hash: string) {
    const tx = await this.web3.eth.getTransaction(hash).catch((_) => null);
    if (tx === null) return "transaction-not-found";
    const receipt = await this.web3.eth.getTransactionReceipt(hash);
    if (receipt === null) return "transaction-pending";
    if (!receipt.status) return "transaction-failed";
    const methodId = tx.input.slice(0, 10);
    if (methodId != this.ercSendMethodId) return "invalid-method";
    const recipient = "0x" + this.trimZeroLeft(tx.input.slice(10, 10 + 64));
    const amountHex = "0x" + this.trimZeroLeft(tx.input.slice(10 + 65));
    const amount = this.web3.utils.hexToNumberString(amountHex);
    const tokenAddress = tx.to;
    return <Erc20Transaction>{ tx, amount, recipient, tokenAddress };
  }

  public async getUserLock(
    lockdropAddress: string,
    ethereumAddress: string,
    tokenAddress: string
  ) {
    let abi = this.getAbi();
    let res = await new this.web3.eth.Contract(abi, lockdropAddress).methods
      .lockWalletStructs(ethereumAddress, tokenAddress)
      .call();
    let claimStatus: "pending" | "finalized";
    switch (res.claimStatus) {
      case "0":
        claimStatus = "pending";
        break;
      case "1":
        claimStatus = "finalized";
        break;
      default:
        throw Error("Unknown claimStatus " + res.claimStatus);
    }
    return <LockWalletStruct>{
      pendingAmount: res.pendingTokenERC20Amount as string,
      approveAmount: res.approvedTokenERC20Amount as string,
      totalAmount: res.tokenERC20Amount as string,
      claimStatus: claimStatus,
      term: Number.parseInt(res.term),
      useValidator: res.isValidator as boolean,
      lockAddress: res.lockAddr as string,
      dataHighwayPublicKey: res.dataHighwayPublicKey as string,
      createdAt: new Date(Number.parseInt(res.createdAt) * 1000),
    };
  }

  public async setClaimStatus(
    lockdropAddress: string,
    ethereumAddress: string,
    claimType: "lock" | "signal",
    claimStatus: "pending" | "finalized",
    approvedAmount: string,
    pendingAmount: string,
    tokenAddress: string
  ) {
    let abi = this.getAbi();
    let txx = new this.web3.eth.Contract(abi, lockdropAddress, {
      from: this.ethereumAccountAddress,
    }).methods.setClaimStatus(
      ethereumAddress,
      claimType === "lock" ? 0 : 1,
      tokenAddress,
      claimStatus === "pending" ? 0 : 1,
      approvedAmount,
      pendingAmount,
      "0"
    );
    return await this.sendTransactionSigned(txx, lockdropAddress);
  }
}
