import App from "./app";
import { TokenUpdater } from "./services/tokenUpdater";
import { mongoConnect } from "./repositories/mongo";
import {
  contractCheckPeriodSeconds,
  contractExpiredOffsetSeconds,
} from "./config";
import * as config from "./config";

async function main() {
  console.log("GAS_FEE_WEI: " + config.gasFeeWei);
  console.log("GAS_LIMIT: " + config.gasLimit);
  console.log("CHAIN_TYPE: " + config.chainType);
  console.log("ETHEREUM_ADDRESS: " + config.ethereumAccountAddress);
  console.log(
    "CONTRACT_CHECK_PERIOD_SECONDS: " + config.contractCheckPeriodSeconds
  );
  console.log(
    "CONTRACT_EXPIRED_OFFSET_SECONDS: " + config.contractExpiredOffsetSeconds
  );
  console.log(
    "CONTRACT_EXPIRED_OFFSET_SECONDS: " + config.contractExpiredOffsetSeconds
  );

  await mongoConnect();
  console.log("Mongo connected successfully");
  new TokenUpdater(contractExpiredOffsetSeconds).start(
    contractCheckPeriodSeconds * 1000
  );
  new App().listen();
}

main().then();
