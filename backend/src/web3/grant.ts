import { prisma } from "../db/client.js";
import { getDistributionWallet, getCampusCoinContract } from "./client.js";

const CONFIRMATION_BLOCKS = 2;

export async function claimGrant(
  grantId: string,
  toAddress: string,
  amount: bigint
): Promise<void> {
  try {
    const wallet = getDistributionWallet();
    const token = getCampusCoinContract(wallet);

    // 配布ウォレット残高確認
    const balance: bigint = await token.balanceOf(wallet.address);
    if (balance < amount) {
      await prisma.grant.update({
        where: { id: grantId },
        data: { status: "failed" },
      });
      console.error("[web3/grant] 配布ウォレット残高不足");
      return;
    }

    // transfer 実行
    const tx = await token.transfer(toAddress, amount);
    await prisma.grant.update({
      where: { id: grantId },
      data: { status: "submitted", txHash: tx.hash },
    });

    // 確認待ち
    const receipt = await tx.wait(CONFIRMATION_BLOCKS);
    if (receipt && receipt.status === 1) {
      await prisma.grant.update({
        where: { id: grantId },
        data: { status: "confirmed", blockNum: receipt.blockNumber },
      });
    } else {
      await prisma.grant.update({
        where: { id: grantId },
        data: { status: "failed" },
      });
    }
  } catch (err) {
    console.error("[web3/grant] error:", err);
    try {
      await prisma.grant.update({
        where: { id: grantId },
        data: { status: "failed" },
      });
    } catch (_) {
      // DB更新失敗は無視（既に別状態の可能性）
    }
  }
}
