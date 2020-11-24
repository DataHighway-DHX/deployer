import App from "./app";
import { TokenUpdater } from "./services/tokenUpdater";

new TokenUpdater().start();
new App().listen();
