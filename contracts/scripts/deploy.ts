import { ethers } from "hardhat";

/**
 * CampusCoin をデプロイする。
 * 配布ウォレットアドレスは環境変数 DISTRIBUTION_WALLET_ADDRESS から取得。
 * 未設定の場合はデプロイヤー自身を配布ウォレットとして使用する。
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const distributionWallet =
    process.env.DISTRIBUTION_WALLET_ADDRESS ?? deployer.address;

  console.log("Deployer:", deployer.address);
  console.log("Distribution wallet:", distributionWallet);

  const Factory = await ethers.getContractFactory("CampusCoin");
  const token = await Factory.deploy(distributionWallet);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("CampusCoin deployed at:", address);
  console.log("CAMPUS_COIN_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
