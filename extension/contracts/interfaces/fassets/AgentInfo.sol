// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.9;

// Verbatim copy of flare-foundation/fassets contracts/userInterfaces/data/AgentInfo.sol
// (commit 6d5c103e4342f0fc7d3683a433a90349d544f774), pulled in directly rather than
// depending on the not-yet-published npm/forge package, purely so `forge build`
// generates a byte-exact ABI for getAgentInfo — hand-transcribing this 40-field
// struct into a JSON ABI by hand would be a real transcription-risk; this isn't.
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library AgentInfo {
    enum Status {
        NORMAL,
        LIQUIDATION,
        FULL_LIQUIDATION,
        DESTROYING,
        DESTROYED
    }

    struct Info {
        AgentInfo.Status status;
        address ownerManagementAddress;
        address ownerWorkAddress;
        address collateralPool;
        address collateralPoolToken;
        string underlyingAddressString;
        bool publiclyAvailable;
        uint256 feeBIPS;
        uint256 poolFeeShareBIPS;
        IERC20 vaultCollateralToken;
        uint256 mintingVaultCollateralRatioBIPS;
        uint256 mintingPoolCollateralRatioBIPS;
        uint256 freeCollateralLots;
        uint256 totalVaultCollateralWei;
        uint256 freeVaultCollateralWei;
        uint256 vaultCollateralRatioBIPS;
        IERC20 poolWNatToken;
        uint256 totalPoolCollateralNATWei;
        uint256 freePoolCollateralNATWei;
        uint256 poolCollateralRatioBIPS;
        uint256 totalAgentPoolTokensWei;
        uint256 announcedVaultCollateralWithdrawalWei;
        uint256 announcedPoolTokensWithdrawalWei;
        uint256 freeAgentPoolTokensWei;
        uint256 mintedUBA;
        uint256 reservedUBA;
        uint256 redeemingUBA;
        uint256 poolRedeemingUBA;
        uint256 dustUBA;
        uint256 liquidationStartTimestamp;
        uint256 maxLiquidationAmountUBA;
        uint256 liquidationPaymentFactorVaultBIPS;
        uint256 liquidationPaymentFactorPoolBIPS;
        int256 underlyingBalanceUBA;
        uint256 requiredUnderlyingBalanceUBA;
        int256 freeUnderlyingBalanceUBA;
        uint256 announcedUnderlyingWithdrawalId;
        uint256 buyFAssetByAgentFactorBIPS;
        uint256 poolExitCollateralRatioBIPS;
        uint256 redemptionPoolFeeShareBIPS;
    }
}
