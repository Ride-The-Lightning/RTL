export interface GetInfoECLR {
  version?: string;
  nodeId?: string;
  alias?: string;
  color?: string;
  features?: string;
  chainHash?: string;
  blockHeight?: number;
  publicAddresses?: string[];
  currency_unit?: string;
  smaller_currency_unit?: string;
  lnImplementation?: string;
}
