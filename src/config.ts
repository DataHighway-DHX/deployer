import "dotenv/config";

export const infuraUrl = process.env.INFURA_URL;

export const contractLockdropAbiSource =
  process.env.CONTRACT_LOCKDROP_ABI_SOURCE;
export const contractLockdropCodeSource =
  process.env.CONTRACT_LOCKDROP_CODE_SOURCE;

export const contractLockAbiSource = process.env.CONTRACT_LOCK_ABI_SOURCE;
export const contractLockCodeSource = process.env.CONTRACT_LOCK_CODE_SOURCE;

export const contractErc20AbiSource = process.env.CONTRACT_ERC20_ABI_SOURCE;
export const contractErc20CodeSource = process.env.CONTRACT_ERC20_CODE_SOURCE;

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

export const mxcToken = process.env.MXC_TOKEN;
export const iotaToken = process.env.IOTA_TOKEN;

export const gasFeeWei = process.env.GAS_FEE_WEI;
export const ercSendMethodId = "0xa9059cbb";
