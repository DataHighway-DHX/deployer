import mongo from "mongodb";
import { mongoDbName, mongoUrl } from "../config";

export async function mongoCollection(name: string) {
  const client = await mongo.connect(mongoUrl, { useUnifiedTopology: true });
  const db = client.db(mongoDbName);
  return db.collection(name);
}
