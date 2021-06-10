export interface Claim {
  type: "lock" | "signal";
  tokenAddress: string;
  tokenName: string;
  amount: string;
  term: number;
  dataHighwayPublicKey: string;
  depositTransaction: string;
  ethereumAccount: string;
  createdAt: Date;
  lockAddress: string;
}
