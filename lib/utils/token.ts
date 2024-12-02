import { TokenData } from "@/types";

export async function fetchTokenData(address: string): Promise<TokenData | null> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`
    );
    const data = await response.json();

    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }

    // Use the first pair as the main data source
    const pair = data.pairs[0];
    
    // Validate required fields and provide defaults
    if (!pair.baseToken || !pair.baseToken.name || !pair.baseToken.symbol) {
      return null;
    }

    // Process social links from the array format
    const socials: { [key: string]: string | null } = {
      website: null,
      twitter: null,
      telegram: null,
      discord: null
    };

    // Add website if available
    if (pair.info?.websites && pair.info.websites.length > 0) {
      socials.website = pair.info.websites[0];
    }

    // Process social links
    if (pair.info?.socials) {
      pair.info.socials.forEach((social: { type: string; url: string }) => {
        if (social.type in socials) {
          socials[social.type] = social.url;
        }
      });
    }

    return {
      baseToken: {
        address: pair.baseToken.address || address,
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
      },
      priceUsd: pair.priceUsd || "0",
      priceChange: {
        h24: pair.priceChange?.h24 || 0,
      },
      volume: {
        h24: pair.volume?.h24 || 0,
        h6: pair.volume?.h6 || 0,
        h1: pair.volume?.h1 || 0,
        m5: pair.volume?.m5 || 0,
      },
      txns: {
        h24: pair.txns?.h24 || { buys: 0, sells: 0 },
        h6: pair.txns?.h6 || { buys: 0, sells: 0 },
        h1: pair.txns?.h1 || { buys: 0, sells: 0 },
        m5: pair.txns?.m5 || { buys: 0, sells: 0 },
      },
      marketCap: pair.marketCap || 0,
      info: {
        imageUrl: pair.info?.imageUrl || null,
        header: pair.info?.header || null,
        socials: socials,
      },

    };
  } catch (error) {
    console.error("Error fetching token data:", error);
    return null;
  }
}
