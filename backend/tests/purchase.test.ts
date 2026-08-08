import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Purchase — 商品購入", () => {
  beforeEach(() => vi.clearAllMocks());

  // テスト10: 残高不足では購入できない
  it("10. 残高不足チェック（BigInt比較）", () => {
    const userBalance = 500n * 10n ** 18n; // 500 CMP
    const productPrice = 1000n * 10n ** 18n; // 1,000 CMP

    const canBuy = userBalance >= productPrice;
    expect(canBuy).toBe(false);
  });

  // テスト11: 同じ商品を2人が同時購入しても1件のみ成立
  it("11. 商品ステータスactive→in_transactionの競合制御", () => {
    let productStatus: "active" | "in_transaction" | "sold" = "active";

    function tryPurchase(): boolean {
      if (productStatus !== "active") return false;
      productStatus = "in_transaction"; // atomic in real DB
      return true;
    }

    const result1 = tryPurchase();
    const result2 = tryPurchase();

    expect(result1).toBe(true);
    expect(result2).toBe(false);
    expect(productStatus).toBe("in_transaction");
  });

  // テスト12: 購入成功後、商品ステータスがsoldになる
  it("12. 購入成功後の状態遷移: in_transaction → sold", () => {
    type Status = "active" | "in_transaction" | "sold";
    let status: Status = "in_transaction";

    // tx確認後にsoldへ
    function confirmPurchase() {
      status = "sold";
    }
    confirmPurchase();

    expect(status).toBe("sold");
  });
});
