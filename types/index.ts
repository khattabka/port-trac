export interface TokenData {
  note?: any;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd: string;
  priceChange: {
    h24: number;
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    m5: {
      buys: number;
      sells: number;
    };
  };
  marketCap: number;
  info: {
    imageUrl?: string;
    header?: string;
    socials?: {
      website?: string;
      twitter?: string;
      telegram?: string;
      discord?: string;
    };
  };
}

export interface TokenEntry extends Omit<TokenData, "note"> {
  note?: string;
  entryData: {
    price: number;
    marketCap: number;
    timestamp: number;
  };
}

export interface TokenGroup {
  id: string;
  name: string;
  description?: string;
  tokens: string[]; // Array of token addresses
}

export interface Portfolio {
  tokens: { [key: string]: TokenEntry };
  groups: { [key: string]: TokenGroup };
}
