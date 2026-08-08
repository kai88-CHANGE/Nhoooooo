import { ethers } from "ethers";
import { cfg } from "../config.js";

let provider: ethers.JsonRpcProvider | null = null;
let distributionWallet: ethers.Wallet | null = null;

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(cfg.RPC_URL);
  }
  return provider;
}

export function getDistributionWallet(): ethers.Wallet {
  if (!distributionWallet) {
    distributionWallet = new ethers.Wallet(
      cfg.DISTRIBUTION_WALLET_PRIVATE_KEY,
      getProvider()
    );
  }
  return distributionWallet;
}

export function getCampusCoinContract(
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(
    cfg.CAMPUS_COIN_ADDRESS,
    ERC20_ABI,
    signerOrProvider ?? getProvider()
  );
}
