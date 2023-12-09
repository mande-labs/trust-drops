// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAnonAadhaarVerifier.sol";

contract TrustDrops is Ownable {
    IERC20 public mandToken;
    address public anonAadhaarVerifierAddr;
    uint public networkConstant = 2;
    uint public totalReputation;
    uint public lastDistributionTime;
    uint public constant DISTRIBUTION_INTERVAL = 1 days;
    uint public constant DISTRIBUTION_DENOMINATOR = 200;
    uint public constant LOGIN_AIRDROP_AMOUNT = 100 * 1e18;

    struct Stake {
        uint amount;
        uint lastNetworkConstant;
    }

    struct Candidate {
        address[] stakers;
        mapping(address => bool) hasStaked;
    }

    mapping(address => Candidate) private candidates;
    mapping(address => mapping(address => Stake)) public stakes;
    mapping(address => uint) public reputation;
    mapping(address => uint) public lastClaimTime;
    mapping(uint256 => bool) public alreadyVerified;
    mapping(address => bool) public alreadyLoggedIn;

    event Staked(address indexed staker, address indexed candidate, uint amount);
    event Unstaked(address indexed staker, address indexed candidate, uint amount);
    event NetworkConstantChanged(uint oldConstant, uint newConstant);
    event TokensClaimed(address indexed candidate, uint amount);

    constructor(address _mandTokenAddress, address _anonAadhaarVerifierAddr) Ownable(msg.sender) {
        mandToken = IERC20(_mandTokenAddress);
        anonAadhaarVerifierAddr = _anonAadhaarVerifierAddr;
        lastDistributionTime = block.timestamp;
    }

    function verifyAadhaar(uint256[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[34] calldata _pubSignals) external {
        require(alreadyVerified[_pubSignals[0]] == false, "Aadhaar already verified");
        bool valid = IAnonAadhaarVerifier(anonAadhaarVerifierAddr).verifyProof(_pA, _pB, _pC, _pubSignals);
        if (valid) {
            alreadyVerified[_pubSignals[0]] = true;
            alreadyLoggedIn[msg.sender] = true;
            mandToken.transfer(msg.sender, LOGIN_AIRDROP_AMOUNT);
        } else {
            revert("Invalid aadhaar proof");
        }
    }

    function stake(address candidate, uint amount) external {
        require(amount > 0, "Amount must be positive");
        mandToken.transferFrom(msg.sender, address(this), amount);

        if (!candidates[candidate].hasStaked[msg.sender]) {
            candidates[candidate].stakers.push(msg.sender);
            candidates[candidate].hasStaked[msg.sender] = true;
        }

        updateReputation(msg.sender, candidate);
        stakes[msg.sender][candidate].amount += amount;
        stakes[msg.sender][candidate].lastNetworkConstant = networkConstant;
        totalReputation += calculateReputation(amount, networkConstant);

        emit Staked(msg.sender, candidate, amount);
    }

    function updateReputation(address staker, address candidate) internal {
        Stake storage _stake = stakes[staker][candidate];
        if (_stake.lastNetworkConstant != networkConstant) {
            uint oldReputation = calculateReputation(_stake.amount, _stake.lastNetworkConstant);
            uint newReputation = calculateReputation(_stake.amount, networkConstant);

            reputation[candidate] = reputation[candidate] - oldReputation + newReputation;
            _stake.lastNetworkConstant = networkConstant;
        }
    }

    function calculateReputation(uint amount, uint _networkConstant) internal pure returns (uint) {
        return uint256(keccak256(abi.encodePacked(amount))) % _networkConstant;
    }

    function updateNetworkConstant(uint newConstant) external onlyOwner {
        require(newConstant > 0, "Constant must be positive");

        uint oldConstant = networkConstant;
        networkConstant = newConstant;

        emit NetworkConstantChanged(oldConstant, newConstant);
    }

    function claimTokens() external {
        require(lastClaimTime[msg.sender] < lastDistributionTime, "Already claimed for the latest distribution");

        uint tokensToDistribute = calculateIndividualAllocation(msg.sender);
        require(tokensToDistribute > 0, "No tokens to claim");

        lastClaimTime[msg.sender] = block.timestamp;
        mandToken.transfer(msg.sender, tokensToDistribute);

        emit TokensClaimed(msg.sender, tokensToDistribute);
    }

    function calculateIndividualAllocation(address candidate) internal returns (uint) {
        if (block.timestamp >= lastDistributionTime + DISTRIBUTION_INTERVAL) {
            uint totalTokens = mandToken.balanceOf(address(this));
            uint tokensForDistribution = totalTokens / DISTRIBUTION_DENOMINATOR;

            uint candidateReputation = reputation[candidate];
            uint candidateAllocation = tokensForDistribution * candidateReputation / totalReputation;
            
            lastDistributionTime = block.timestamp;
            return candidateAllocation;
        }
        return 0;
    }

    function unstake(address candidate, uint amount) external {
        require(amount > 0, "Amount must be positive");
        Stake storage _stake = stakes[msg.sender][candidate];

        require(_stake.amount >= amount, "Insufficient staked amount");

        updateReputation(msg.sender, candidate);
        _stake.amount -= amount;
        totalReputation -= calculateReputation(amount, networkConstant);

        mandToken.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, candidate, amount);
    }

    function getCurrentReputation(address candidate) public returns (uint) {
        uint length = candidates[candidate].stakers.length;
        for (uint i = 0; i < length; i++) {
            updateReputation(candidates[candidate].stakers[i], candidate);
        }
        return reputation[candidate];
    }

    // View functions
    function getUserStakeAndReputation(address user) public view returns (uint[] memory, uint) {
        uint[] memory stakesArray = new uint[](candidates[user].stakers.length);
        for (uint i = 0; i < candidates[user].stakers.length; i++) {
            stakesArray[i] = stakes[user][candidates[user].stakers[i]].amount;
        }
        return (stakesArray, reputation[user]);
    }

    function getCandidateStakesAndReputation(address candidate) public view returns (uint, uint) {
        uint totalStakes = 0;
        for (uint i = 0; i < candidates[candidate].stakers.length; i++) {
            totalStakes += stakes[candidates[candidate].stakers[i]][candidate].amount;
        }
        return (totalStakes, reputation[candidate]);
    }

    function getAllUsersReputation() public view returns (address[] memory, uint[] memory) {
        // Assuming we have a way to track all user addresses in the `users` array
        address[] memory users;
        uint[] memory reputations = new uint[](users.length);
        for (uint i = 0; i < users.length; i++) {
            reputations[i] = reputation[users[i]];
        }
        return (users, reputations);
    }
}
