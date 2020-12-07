import { ApiError } from "../apiError";
import { LockdropStoreRepo } from "../repositories/lockdropStore";
import {
  Erc20Transaction,
  Erc20TxSendWrapper,
  LockdropContractRepo,
  LockWalletStruct,
  SignalWalletStruct,
  TxSendWrapper,
} from "../repositories/lockdropContract";
import { LockdropContract } from "../interfaces/contract";
import * as config from "../config";
import { LockContractRepo } from "../repositories/lockContract";
import { Transaction } from "web3-core";
import { Erc20ContractRepo } from "../repositories/erc20Contract";

export type Token = "mxc" | "iota";

export class LockdropService {
  public lockdropStoreRepo: LockdropStoreRepo = new LockdropStoreRepo();
  public lockdropContractRepo: LockdropContractRepo = new LockdropContractRepo();
  public lockContractRepo: LockContractRepo = new LockContractRepo();
  public erc20ContractRepo: Erc20ContractRepo = new Erc20ContractRepo();

  public iotaToken = config.iotaToken;
  public mxcToken = config.mxcToken;
  public lockdropOwner = config.ethereumAccountAddress;

  public getTokenAddressFromName(name: Token) {
    switch (name) {
      case "iota":
        return this.iotaToken;
      case "mxc":
        return this.mxcToken;
    }
  }

  public async contractGuard(contract: LockdropContract) {
    if (!contract) {
      throw new ApiError(
        "ContractNotDeployed",
        404,
        "Contract not deployed. Wait"
      );
    }

    let endTime = await this.lockdropContractRepo.getEndTime(contract.address);
    if (endTime < Date.now() / 1000) {
      throw new ApiError(
        "ContractExpired",
        500,
        "Contract expired. Contact administrator"
      );
    }
  }
  public async getContract() {
    return this.lockdropStoreRepo.getContract();
  }

  public async lock(
    sender: string,
    amount: string,
    useValidator: boolean,
    term: number,
    dhxPublicKey: string,
    token: Token
  ) {
    let contract = await this.lockdropStoreRepo.getContract();
    await this.contractGuard(contract);

    const tokenAddress = this.getTokenAddressFromName(token);

    try {
      const event = await this.lockdropContractRepo.lock(
        contract.address,
        sender,
        amount,
        useValidator,
        term,
        dhxPublicKey,
        tokenAddress
      );
      const res = await event.waitHash();
      return {
        transactionHash: res,
      };
    } catch (e) {
      if (e.public && e.code == "InvalidArgument") {
        throw new ApiError("InvalidArgument", 400, e.message);
      }
      throw e;
    }
  }

  public async signal(
    amount: string,
    term: number,
    dhxPublicKey: string,
    token: Token
  ) {
    let contract = await this.lockdropStoreRepo.getContract();
    await this.contractGuard(contract);

    const tokenAddress = this.getTokenAddressFromName(token);

    try {
      const event = await this.lockdropContractRepo.signal(
        contract.address,
        amount,
        term,
        dhxPublicKey,
        tokenAddress
      );
      const res = await event.waitHash();
      return {
        transactionHash: res,
      };
    } catch (e) {
      if (e.public && e.code == "InvalidArgument") {
        throw new ApiError("InvalidArgument", 400, e.message);
      }
      throw e;
    }
  }

  public async saveClaim(claim: Claim) {
    await this.lockdropStoreRepo.addClaim(claim);
  }

  public async getClaims(dhxPublicKey: string) {
    dhxPublicKey = this.lockdropContractRepo.formatDhxPublicKey(dhxPublicKey);
    return this.lockdropStoreRepo.getClaimsByDhx(dhxPublicKey);
  }

  public async getClaimByDate(dhxPublicKey: string, date: Date) {
    return this.lockdropStoreRepo.getClaim(dhxPublicKey, date);
  }

  public async getClaimByTx(tx: string) {
    return this.lockdropStoreRepo.getClaimByTx(tx);
  }

  public async verifyLockTransaction(
    contract: LockdropContract,
    userLock: LockWalletStruct,
    txInfo: Erc20Transaction
  ) {
    if (txInfo.recipient.toLowerCase() !== userLock.lockAddress.toLowerCase()) {
      throw new ApiError(
        "WrongDestinationTxLock",
        400,
        `Transaction destination must be equal to ${userLock.lockAddress}`
      );
    }

    const lockInfo = await this.lockContractRepo.getInfo(userLock.lockAddress);

    if (lockInfo.unlockTime <= new Date())
      throw new ApiError(
        "UnlockedTxLock",
        400,
        `Lock contract already unlocked`
      );

    if (
      lockInfo.tokenAddress.toLowerCase() !== txInfo.tokenAddress.toLowerCase()
    )
      throw new ApiError(
        "WrongTokenAddressTxLock",
        400,
        `Token address unknown, must be equal to ${lockInfo.tokenAddress}`
      );
    if (BigInt(txInfo.amount) < BigInt(userLock.pendingAmount)) {
      let formattedAmount = userLock.pendingAmount.padStart(20, "0");
      formattedAmount =
        formattedAmount.slice(0, formattedAmount.length - 18) +
        "." +
        formattedAmount.slice(formattedAmount.length - 18);
      throw new ApiError(
        "WrongTokenAmountTxLock",
        400,
        `Transaction amount must be equal to ${formattedAmount}`
      );
    }

    let tokenName = "unknown";
    if (lockInfo.tokenAddress.toLowerCase() == this.mxcToken.toLowerCase()) {
      tokenName = "mxc";
    }
    if (lockInfo.tokenAddress.toLowerCase() == this.iotaToken.toLowerCase()) {
      tokenName = "iota";
    }

    return <Claim>{
      amount: txInfo.amount,
      type: "lock",
      tokenAddress: lockInfo.tokenAddress,
      tokenName: tokenName,
      dataHighwayPublicKey: userLock.dataHighwayPublicKey,
      term: userLock.term,
      depositTransaction: txInfo.tx.hash,
      ethereumAccount: txInfo.tx.from,
      createdAt: userLock.createdAt,
      lockAddress: userLock.lockAddress,
    };
  }

  public async verifySignalTransaction(
    contract: LockdropContract,
    userSignal: SignalWalletStruct,
    txInfo: Transaction,
    token: Token
  ) {
    if (txInfo.to.toLowerCase() !== contract.address.toLowerCase()) {
      throw new ApiError(
        "WrongDestinationTxLock",
        400,
        `Transaction destination must be equal to ${contract.address}`
      );
    }
    const tokenAddress = this.getTokenAddressFromName(token);

    const balance = await this.erc20ContractRepo.getBalance(
      tokenAddress,
      txInfo.from
    );
    if (BigInt(balance) < BigInt(userSignal.pendingAmount)) {
      let formattedAmount = userSignal.pendingAmount.padStart(20, "0");
      formattedAmount =
        formattedAmount.slice(0, formattedAmount.length - 18) +
        "." +
        formattedAmount.slice(formattedAmount.length - 18);
      throw new ApiError(
        "WrongTokenAmountTxLock",
        400,
        `Account should have at least ${formattedAmount} ${token}`
      );
    }

    return <Claim>{
      amount: userSignal.totalAmount,
      type: "signal",
      tokenAddress: tokenAddress,
      tokenName: token,
      dataHighwayPublicKey: userSignal.dataHighwayPublicKey,
      term: userSignal.term,
      depositTransaction: txInfo.hash,
      ethereumAccount: txInfo.from,
      createdAt: userSignal.createdAt,
      lockAddress: contract.address,
    };
  }

  public async setClaimStatus(contract: LockdropContract, claim: Claim) {
    return this.lockdropContractRepo.setClaimStatus(
      contract.address,
      claim.ethereumAccount,
      claim.type,
      "finalized",
      claim.amount,
      "0",
      claim.tokenAddress
    );
  }

  public verifyErc20Tx(txInfo: Erc20TxSendWrapper) {
    if (txInfo === "transaction-not-found")
      throw new ApiError(
        "TransactionNotFoundTxLock",
        400,
        `Transaction not found`
      );
    if (txInfo === "transaction-failed")
      throw new ApiError(
        "TransactionFailedTxLock",
        400,
        `Passed transaction has failed`
      );
    if (txInfo === "transaction-pending")
      throw new ApiError(
        "TransactionPendingTxLock",
        400,
        `Passed transaction is pending`
      );
    if (txInfo === "invalid-method")
      throw new ApiError(
        "InvalidMethodTxLock",
        400,
        `Invalid method was called on passed transaction, must be 'send'`
      );
    return txInfo;
  }

  public veriyfTx(txInfo: TxSendWrapper) {
    if (txInfo === "transaction-not-found")
      throw new ApiError(
        "TransactionNotFoundTxLock",
        400,
        `Transaction not found`
      );
    if (txInfo === "transaction-pending")
      throw new ApiError(
        "TransactionPendingTxLock",
        400,
        `Passed transaction is pending`
      );
    return txInfo;
  }

  public async claimLockByTransaction(transactionHash: string) {
    let txInfo = await this.lockdropContractRepo.getERC20SendTx(
      transactionHash
    );
    txInfo = this.verifyErc20Tx(txInfo);
    let contract = await this.lockdropStoreRepo.getContract();
    const userLock = await this.lockdropContractRepo.getUserLock(
      contract.address,
      txInfo.tx.from,
      this.mxcToken
    );

    if (userLock.claimStatus === "finalized") {
      throw new ApiError(
        "ClaimStatusFinalizedTxLock",
        400,
        "Claim already finalized"
      );
    }

    const claim = await this.verifyLockTransaction(contract, userLock, txInfo);
    const event = await this.setClaimStatus(contract, claim);
    event.waitResult().then((_) => this.saveClaim(claim));
    return { transactionHash: await event.waitHash() };
  }

  public async claimSignalByTransaction(transactionHash: string, token: Token) {
    let txInfo = await this.lockdropContractRepo.getTx(transactionHash);
    txInfo = this.veriyfTx(txInfo);
    let contract = await this.lockdropStoreRepo.getContract();
    const userSignal = await this.lockdropContractRepo.getUserSignal(
      contract.address,
      txInfo.tx.from,
      this.mxcToken
    );

    if (userSignal.claimStatus === "finalized") {
      throw new ApiError(
        "ClaimStatusFinalizedTxLock",
        400,
        "Claim already finalized"
      );
    }

    const claim = await this.verifySignalTransaction(
      contract,
      userSignal,
      txInfo.tx,
      token
    );

    const event = await this.setClaimStatus(contract, claim);
    event.waitResult().then((_) => this.saveClaim(claim));
    return { transactionHash: await event.waitHash() };
  }
}
