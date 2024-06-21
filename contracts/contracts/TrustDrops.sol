// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustDrops is Ownable {
    uint public totalReputation;
    uint public seedFund;
    uint public deploymentWeek;
    uint public approvalAirdropAmount = 30 * 1e18;
    address public approver;

    struct Stake {
        uint amount;
    }

    struct Cred {
        uint amount;
    }

    struct Candidate {
        address[] stakers;
        mapping(address => bool) hasStaked;
    }

    struct WeeklyRewardsParam {
        uint weekNumber;
        uint reward;
    }

    struct RewardDetails {
        uint lastUpdatedWeek;
        uint lastWeeklyTotalCred;
        mapping(uint => uint) weeklyTotalCred;
        mapping(uint => uint) weeklyTotalRewards;
        mapping(address => uint) userLastUpdatedWeek;
        mapping(address => uint) userLastClaimed;
        mapping(address => uint) lastUserCred;
        mapping(address => mapping(uint => uint)) userWeeklyCred;
    }

    RewardDetails public rewardDetails;
    mapping(address => Candidate) private candidates;
    mapping(address => mapping(address => Stake)) public stakes;
    mapping(address => uint) public totalStakedByUser;
    mapping(address => uint) public reputation;
    mapping(address => bool) public approvedAddress;
    mapping(bytes32 => bool) public approvedId;
    address[] public users;
    mapping(address => bool) public userAdded;

    event Staked(address indexed staker, address indexed candidate, uint amount, uint cred, uint timestamp);
    event Unstaked(address indexed staker, address indexed candidate, uint amount, uint cred, uint timestamp);
    event TokensClaimed(address indexed candidate, uint amount);

    constructor() Ownable(msg.sender) {
        approver = msg.sender;
        deploymentWeek = block.timestamp / 1 weeks;
    }

    function updateApprover(address _newApprover) external onlyOwner {
        approver = _newApprover;
    }

    function depositSeedFunds() external payable {
        seedFund += msg.value;
    }

    function updateAirdropAmount(uint _updatedAmount) onlyOwner() external {
        approvalAirdropAmount = _updatedAmount;
    }

    function updateWeeklyTotalRewards(WeeklyRewardsParam[] memory _weeklyRewards) external onlyOwner {
        for (uint i=0; i<_weeklyRewards.length; i++) {
            rewardDetails.weeklyTotalRewards[_weeklyRewards[i].weekNumber] = _weeklyRewards[i].reward;
        }
    }

    function approve(address _user, bytes32 _id, uint _amount) external {
        require(msg.sender == approver, "TrustDrops::Not authorised");
        require(approvedAddress[_user] == false, "TrustDrops::Address already approved");
        require(approvedId[_id] == false, "TrustDrops::Id already approved");
        approvedAddress[_user] = true;
        approvedId[_id] = true;
        seedFund -= _amount;
        (bool sent, ) = (_user).call{value: _amount}("");
        require(sent, "TrustDrops::Failed to send Ether");
    }

    // safety fallback 
    function withdraw() external onlyOwner {
        uint totBal = address(this).balance;
        address owner = owner();
        (bool sent, ) = (owner).call{value: totBal}("");
        require(sent, "TrustDrops::Failed to withdraw Ether");
    }

    function stake(address candidate) payable external {
        require(approvedAddress[msg.sender], "Link your wallet with twitter to stake");
        uint amount = msg.value;
        require(amount > 0, "TrustDrops::Amount must be positive");

        if (!userAdded[candidate]) {
            users.push(candidate);
            userAdded[candidate] = true;
        }

        if (!candidates[candidate].hasStaked[msg.sender]) {
            candidates[candidate].stakers.push(msg.sender);
            candidates[candidate].hasStaked[msg.sender] = true;
        }

        uint oldTotalReputation = calculateReputation(stakes[msg.sender][candidate].amount);
        stakes[msg.sender][candidate].amount += amount;
        totalStakedByUser[msg.sender] += amount;
        uint newTotalReputation = calculateReputation(stakes[msg.sender][candidate].amount);
        reputation[candidate] = reputation[candidate] - oldTotalReputation + newTotalReputation;
        totalReputation = totalReputation + newTotalReputation - oldTotalReputation;

        // Update reward details
        _updateStaleWeekData(candidate);
        _updateCurrentWeeklyCredData(candidate, newTotalReputation - oldTotalReputation, 0);

        emit Staked(msg.sender, candidate, amount, newTotalReputation - oldTotalReputation, block.timestamp);
    }

    function unstake(address candidate, uint amount) external {
        require(amount > 0, "TrustDrops::Amount must be positive");
        Stake storage _stake = stakes[msg.sender][candidate];
        require(_stake.amount >= amount, "TrustDrops::Insufficient staked amount");

        uint oldTotalReputation = calculateReputation(stakes[msg.sender][candidate].amount);
        _stake.amount -= amount;
        totalStakedByUser[msg.sender] -= amount;
        uint newTotalReputation = calculateReputation(stakes[msg.sender][candidate].amount);
        reputation[candidate] = reputation[candidate] + newTotalReputation - oldTotalReputation;
        totalReputation = totalReputation + newTotalReputation - oldTotalReputation;

        // Update rewards details
        _updateStaleWeekData(candidate);
        _updateCurrentWeeklyCredData(candidate, oldTotalReputation - newTotalReputation, 1);

        (bool sent, ) = (msg.sender).call{value: amount}("");
        require(sent, "TrustDrops::Failed to send Ether");

        emit Unstaked(msg.sender, candidate, amount, oldTotalReputation - newTotalReputation, block.timestamp);
    }

    function calculateReputation(uint x) internal pure returns (uint) {
        if (x == 0) return 0;
        uint z = (x + 1) / 2;
        uint y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y/1e7;
    }

    function allocation(address _user) external view returns(uint) {
        return _calculateAllocation(_user);
    }

    function currentRelativeWeek() internal view returns(uint) {
        return  (block.timestamp / 1 weeks) - deploymentWeek + 1;
    }

    function weeklyYield() external view returns(uint) {
        uint currentWeek = currentRelativeWeek();
        return  rewardDetails.weeklyTotalRewards[currentWeek] / rewardDetails.weeklyTotalCred[currentWeek];
    }

    function _calculateAllocation(address _user) internal view returns(uint) {
        if (currentRelativeWeek() == 1) {
            return 0;
        }
        uint currentWeek = currentRelativeWeek() - 1;
        uint startingWeek = rewardDetails.userLastClaimed[_user];
        if(startingWeek != 0) {
            startingWeek += 1;
        }

        uint totalReward = 0;
        
        for (uint week = startingWeek; week <= currentWeek; week++) {
            uint userCred = rewardDetails.userWeeklyCred[_user][week];
            uint weekTotalCred = rewardDetails.weeklyTotalCred[week];
            uint weekTotalRewards = rewardDetails.weeklyTotalRewards[week];

            // Use fallback values if there is no data for the current week
            if (userCred == 0) {
                userCred = findLastUserCred(week, _user);
            }
            //suggestion: maybe should return 0 or exception if weekTotalCred is 0
            if (weekTotalCred == 0 && rewardDetails.lastUpdatedWeek <= week) {
                weekTotalCred = rewardDetails.lastWeeklyTotalCred;
            }

            if (weekTotalCred > 0) {
                uint userWeekReward = (weekTotalRewards * userCred) / weekTotalCred;
                totalReward += userWeekReward;
            }
        }
        
        return totalReward;
    }

    function claimTokens() external {
        require(approvedAddress[msg.sender], "Link your wallet with twitter to claim");
        uint alloc = _calculateAllocation(msg.sender);
        uint available = address(this).balance - seedFund;
        require(alloc <= available, "Funds unavailable");
        require(alloc > 0, "No reward allocation");
        _updateStaleWeekData(msg.sender);
        rewardDetails.userLastClaimed[msg.sender] = currentRelativeWeek() - 1;
        (bool sent, ) = msg.sender.call{value: alloc}("");
        require(sent, "TrustDrops::Failed to send Ether");
        emit TokensClaimed(msg.sender, alloc);
    }

    function _updateStaleWeekData(address _user) internal {
        uint currentWeek = currentRelativeWeek();
        // Update the weeklyTotalCred for weeks that haven't been updated
        for (uint week = rewardDetails.lastUpdatedWeek + 1; week <= currentWeek; week++) {
            if (rewardDetails.weeklyTotalCred[week] == 0) {
                rewardDetails.weeklyTotalCred[week] = rewardDetails.lastWeeklyTotalCred;
            }
        }
        rewardDetails.lastUpdatedWeek = currentWeek;
        rewardDetails.lastWeeklyTotalCred = rewardDetails.weeklyTotalCred[currentWeek];

        // Update the userWeeklyCred for weeks that haven't been updated
        for (uint week = rewardDetails.userLastUpdatedWeek[_user] + 1; week <= currentWeek; week++) {
            if (rewardDetails.userWeeklyCred[_user][week] == 0) {
                rewardDetails.userWeeklyCred[_user][week] = findLastUserCred(week, _user);
            }
        }
        rewardDetails.userLastUpdatedWeek[_user] = currentWeek;
        rewardDetails.lastUserCred[_user] = rewardDetails.userWeeklyCred[_user][currentWeek];
    }

    function _updateCurrentWeeklyCredData(address _user, uint credScore, uint stakeOrUnstake) internal {
        uint currentWeek = currentRelativeWeek();
        if (stakeOrUnstake == 0) {
            rewardDetails.weeklyTotalCred[currentWeek] += credScore;
            rewardDetails.userWeeklyCred[_user][currentWeek] += credScore;
        } else if (stakeOrUnstake == 1) {
            rewardDetails.weeklyTotalCred[currentWeek] -= credScore;
            rewardDetails.userWeeklyCred[_user][currentWeek] -= credScore;
        }
        rewardDetails.lastUpdatedWeek = currentWeek;
        rewardDetails.userLastUpdatedWeek[_user] = currentWeek;
        rewardDetails.lastWeeklyTotalCred = rewardDetails.weeklyTotalCred[currentWeek];
        rewardDetails.lastUserCred[_user] = rewardDetails.userWeeklyCred[_user][currentWeek];
    }

    function findLastUserCred(uint endWeek, address _user) {
        for (uint week = endWeek; week >= 1; week--) {
            uint userCred = rewardDetails.userWeeklyCred[_user][week];

            if(userCred > 0) {
                return userCred;
            }
        }

        return 0;
    }
    
    receive() external payable {}
}
