import { mongoCollection } from "./mongo";
import { LockdropContract } from "../interfaces/contract";
import { Claim } from "../interfaces/claim";

const contractsCollectionName = "contracts";
const claimsCollectionName = "claims";
export class LockdropStoreRepo {
  connecting: boolean = false;

  constructor() {}

  private async getContractsCollection() {
    return await mongoCollection(contractsCollectionName);
  }

  private async getClaimsCollection() {
    return await mongoCollection(claimsCollectionName);
  }

  public async getContract() {
    const collection = await this.getContractsCollection();
    const arr = await collection
      .find()
      .limit(1)
      .sort({ $natural: -1 })
      .toArray();
    if (arr.length == 0) return null;
    return arr[0] as LockdropContract;
  }

  public async putContract(item: LockdropContract) {
    const collection = await this.getContractsCollection();
    await collection.insertOne(item);
  }

  public async getClaimsByDhx(publicKey: string) {
    const collection = await this.getClaimsCollection();
    return (await collection
      .find()
      .sort({ $natural: -1 })
      .filter({ dataHighwayPublicKey: publicKey })
      .toArray()) as Claim[];
  }

  public async getClaim(publicKey: string, date: Date) {
    const collection = await this.getClaimsCollection();
    const arr = (await collection
      .find()
      .sort({ $natural: -1 })
      .limit(1)
      .filter({ dataHighwayPublicKey: publicKey, createdAt: date })
      .toArray()) as Claim[];
    if (arr.length == 0) return null;
    return arr[0];
  }

  public async getClaimByTx(tx: string) {
    const collection = await this.getClaimsCollection();
    const arr = (await collection
      .find()
      .sort({ $natural: -1 })
      .limit(1)
      .filter({ depositTransaction: tx })
      .toArray()) as Claim[];
    if (arr.length == 0) return null;
    return arr[0];
  }

  public async addClaim(claim: Claim) {
    const collection = await this.getClaimsCollection();
    await collection.insertOne(claim);
  }
}
