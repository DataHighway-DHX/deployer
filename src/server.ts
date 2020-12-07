import App from "./app";
import { TokenUpdater } from "./services/tokenUpdater";
import { mongoConnect } from "./repositories/mongo";
import {
  contractCheckPeriodSeconds,
  contractExpiredOffsetSeconds,
} from "./config";


async function main() {
  await mongoConnect();
  new TokenUpdater(contractExpiredOffsetSeconds).start(
      contractCheckPeriodSeconds * 1000
  );
  new App().listen();
}

main().then();
