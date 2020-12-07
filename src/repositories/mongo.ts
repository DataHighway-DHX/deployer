import mongo, { MongoClient } from "mongodb";
import { mongoDbName, mongoUrl } from "../config";

let client: MongoClient;
export async function mongoConnect() {
  client = await mongo.connect(mongoUrl, { useUnifiedTopology: true });
}

export async function mongoCollection(name: string) {
  const db = client.db(mongoDbName);
  return db.collection(name);
}
