import App from "./app";
import { TokenUpdater } from "./services/tokenUpdater";
import {
  contractCheckPeriodSeconds,
  contractExpiredOffsetSeconds,
} from "./config";

new TokenUpdater(contractExpiredOffsetSeconds).start(
  contractCheckPeriodSeconds * 1000
);
new App().listen();
