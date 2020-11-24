import { Collection } from "mongodb";
import { mongoCollection } from "./mongo";

const collectionName = "contracts";
export class LockdropStoreRepo {
  mongoClient: Collection;
  connecting: boolean = false;

  constructor() {}

  private async getMongoCollection() {
    while (this.mongoClient == null && this.connecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.mongoClient)
      try {
        this.connecting = true;
        this.mongoClient = await mongoCollection(collectionName);
      } finally {
        this.connecting = false;
      }
    return this.mongoClient;
  }

  public async get() {
    const collection = await this.getMongoCollection();
    const arr = await collection
      .find()
      .limit(1)
      .sort({ $natural: -1 })
      .toArray();
    if (arr.length == 0) return null;
    return arr[0] as LockdropContract;
  }

  public async put(item: LockdropContract) {
    const collection = await this.getMongoCollection();
    await collection.insertOne(item);
  }
}
