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
export class LockdropStoreRepo {
  docClient: AWS.DynamoDB.DocumentClient;

  constructor() {
    this.docClient = new AWS.DynamoDB.DocumentClient();
  }

  public async getForAddress(ethAddress: string) {
    let params = {
      TableName: tableName,
      Key: {
        [nameof<Contract>("deployedFor")]: ethAddress,
      },
    };
    let doc = await this.docClient.get(params).promise();
    console.log(doc);
  }

  public async put(item: Contract) {
    await this.docClient
      .put({
        TableName: tableName,
        Item: item,
      })
      .promise();
  }
}
