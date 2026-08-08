// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title CampusCoin (CMP)
/// @notice 学内フリマで使用する仮想通貨トークン。decimals=18。
/// @dev 初期供給は配布ウォレットへmint済み。追加mintはMINTER_ROLEのみ可能。
contract CampusCoin is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(address distributionWallet) ERC20("CampusCoin", "CMP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        // 初期供給 1,000,000 CMP を配布ウォレットへ
        _mint(distributionWallet, 1_000_000 * 10 ** decimals());
    }

    /// @notice MINTER_ROLEのみが追加mintを実行できる
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
