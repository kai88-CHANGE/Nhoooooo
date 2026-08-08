import { expect } from "chai";
import { ethers } from "hardhat";

describe("CampusCoin", () => {
  async function deploy() {
    const [deployer, distribution, user1, user2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CampusCoin");
    const token = await Factory.deploy(distribution.address);
    return { token, deployer, distribution, user1, user2 };
  }

  it("名前・シンボル・decimalsが正しい", async () => {
    const { token } = await deploy();
    expect(await token.name()).to.equal("CampusCoin");
    expect(await token.symbol()).to.equal("CMP");
    expect(await token.decimals()).to.equal(18);
  });

  it("初期供給1,000,000CMPが配布ウォレットに入る", async () => {
    const { token, distribution } = await deploy();
    const bal = await token.balanceOf(distribution.address);
    expect(bal).to.equal(ethers.parseEther("1000000"));
  });

  it("transfer: 配布→user1に10,000CMP送金できる", async () => {
    const { token, distribution, user1 } = await deploy();
    const amount = ethers.parseEther("10000");
    await token.connect(distribution).transfer(user1.address, amount);
    expect(await token.balanceOf(user1.address)).to.equal(amount);
  });

  it("MINTER_ROLEなしのアカウントはmintできない", async () => {
    const { token, user1, user2 } = await deploy();
    await expect(
      token.connect(user1).mint(user2.address, ethers.parseEther("1"))
    ).to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
  });

  it("10,000CMPのBigInt変換が18decimals込みで正確", async () => {
    const expected = 10_000n * 10n ** 18n;
    expect(ethers.parseEther("10000")).to.equal(expected);
  });
});
