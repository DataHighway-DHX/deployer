import "dotenv/config";

export const infuraUrl = process.env.INFURA_URL;
export const contractAbiSource = process.env.CONTRACT_ABI_SOURCE;
export const contractCodeSource = process.env.CONTRACT_CODE_SOURCE;
export const ethereumAccountAddress = process.env.ETHEREUM_ACCOUNT_ADDRESS;
export const ethereumAccountPrivateKey =
  process.env.ETHEREUM_ACCOUNT_PRIVATE_KEY;
export const chainType = process.env.CHAIN_TYPE;
export const gasLimit = Number.parseInt(process.env.GAS_LIMIT);

export const mongoUrl = process.env.MONGO_URL;
export const mongoDbName = process.env.MONGO_DB_NAME;

export const contractCheckPeriodSeconds = Number.parseInt(
  process.env.CONTRACT_CHECK_PERIOD_SECONDS
);
export const contractExpiredOffsetSeconds = Number.parseInt(
  process.env.CONTRACT_EXPIRED_OFFSET_SECONDS
);
