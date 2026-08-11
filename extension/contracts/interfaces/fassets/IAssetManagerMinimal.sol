// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.9;

import {AgentInfo} from "./AgentInfo.sol";

/// @notice Minimal slice of flare-foundation/fassets IAssetManager.sol — only the
/// read functions Solvra actually calls (getAgentInfo, getAllAgents), so we don't
/// need to vendor the full interface and its unrelated data-struct imports
/// (AvailableAgentInfo, CollateralType, AssetManagerSettings) just to compile.
interface IAssetManagerMinimal {
    function getAgentInfo(address _agentVault) external view returns (AgentInfo.Info memory);

    function getAllAgents(uint256 _start, uint256 _end)
        external view
        returns (address[] memory _agents, uint256 _totalLength);
}
