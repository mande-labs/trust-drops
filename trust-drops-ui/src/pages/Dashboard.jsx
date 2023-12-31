import React, { useState, useEffect, useContext } from 'react';
import LeaderBoardModal from '../components/LeaderBoardModal';
import Navbar from '../components/Navbar';
import { PiCopySimpleBold } from 'react-icons/pi';
import { MdOutlineLeaderboard, MdOutlineVerifiedUser } from 'react-icons/md';
import { FaRegUserCircle, FaRegDotCircle } from 'react-icons/fa';
import { IoLockClosedOutline } from 'react-icons/io5';
import { TbUserUp } from 'react-icons/tb';
import { FaRegSmileWink } from 'react-icons/fa';
import { RiLiveLine } from 'react-icons/ri';
import {ethers} from 'ethers';
import trustdropABI from '../abis/trustdropABI.json';

import {
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
} from '@heroicons/react/outline';

import { DataContext } from '../context/DataContext';



function Dashboard() {
  
  const [openModal, setOpenModal] = useState(false);
  const [isStaking, setIsStaking] = useState(true);
  const [activeTab, setActiveTab] = useState('Your Stakes');

  const [tokenBalance, setTokenBalance] = useState(0)
  const [stakedBalance, setStakedBalance] = useState(0)
  const [credScore, setCredScore] = useState(0)
  const [allocatedTokens, setAllocatedTokens] = useState(0)
  const [stakesData, setStakesData] = useState([])
  const [receivedData, setReceivedData] = useState([])

  const [stakeForAddress, setStakeForAddress] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');

  const [wakuMessageType, setWakuMessageType] = useState("staked") // staked, unstaked, winked

  const { accountAddress, contract, sendMessage, feedItems, erc20Contract } = useContext(DataContext);

  console.log("accountAddress", accountAddress)


  // const stakesData = [
  //   {
  //     address: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
  //     stake: '100.00 $DAO',
  //     credibility: '10.00',
  //   },
  //   {
  //     address: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
  //     stake: '400.00 $DAO',
  //     credibility: '40.00',
  //   },
  //   { address: '0xadfe2...f15d2', stake: '25.00 $DAO', credibility: '5.00' },
  //   { address: '0xadfe2...f135d', stake: '16.00 $DAO', credibility: '4.00' },
  // ];

  const LiveFeedItem = ({ type, from, to }) => {
    const iconSize = 'h-6 w-6';

    const icons = {
      winked: <FaRegSmileWink className={iconSize + ' text-blue-500'} />,
      staked: <LockClosedIcon className={iconSize + ' text-green-500'} />,
      unstaked: <LockOpenIcon className={iconSize + ' text-red-500'} />,
    };

    return (
      <div
        className={`flex items-center  w-full gap-4 p-2 ${
          type == 'winked'
            ? 'bg-blue-50'
            : (type == 'unstaked' ? 'bg-red-50' : '') ||
              (type == 'staked' ? 'bg-green-50' : '')
        }`}
      >
        <div className=''> {icons[type]}</div>

        <div className='w-full rounded-sm'>
          <span className='flex-1 items-center gap-2 flex'>
            {formatAddress(from)}{' '}
            <PiCopySimpleBold className='text-[#7071E8]' />
          </span>
          <span
            className={`${
              type == 'winked'
                ? 'bg-blue-500 text-white text-center px-2 font-light'
                : (type == 'unstaked'
                    ? 'bg-red-500 text-white text-center px-2 font-light'
                    : '') ||
                  (type == 'staked'
                    ? 'bg-green-500 text-white text-center px-2 font-light'
                    : '')
            }`}
          >
            {type}
          </span>
          <span className='flex-1 flex items-center gap-2'>
            {formatAddress(to)} <PiCopySimpleBold className='text-[#7071E8]' />
          </span>
        </div>
      </div>
    );
  };

  // const receivedData = [
  //   {
  //     address: '0xadfe2...f15d4',
  //     received: '120.00 $DAO',
  //     credibilityGained: '15.00',
  //   },
  // ];
  const formatAddress = (address) => {
    const maxLength = 18;
    return address.length > maxLength
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : address;
  };

  const copyToClipboard = async (wallet) => {
    try {
      await navigator.clipboard.writeText(wallet);
    } catch (err) {
      // Handle the error case
    }
  };

  const handleStake = async () => {
    try {
    let estimation = await erc20Contract.estimateGas.approve(contract.address, ethers.utils.parseUnits(stakeAmount));
    const approveTx = await erc20Contract.approve(contract.address, ethers.utils.parseUnits(stakeAmount), {
          gasPrice: estimation, 
        });
    await approveTx.wait()

    estimation = await contract.estimateGas.stake(stakeForAddress, ethers.utils.parseUnits(stakeAmount));
    const stakeTx = await contract.stake(stakeForAddress, ethers.utils.parseUnits(stakeAmount), {
          gasPrice: estimation, 
        });
    await stakeTx.wait()

      console.log('Stake transaction hash', stakeTx.hash)
      console.log('Stake function executed');
      sendMessage('staked', stakeForAddress, stakeAmount)
    } catch (e) {
      console.log(e)
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        // setIsLoading(false);
        console.log('Make sure you have metamask!');
      } else {
        console.log('We have the ethereum object', ethereum);
        const accounts = await ethereum.request({ method: 'eth_accounts' });

        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log('Found an authorized account', account);
          // setCurrentAccount(account);
        }
      }
    } catch (e) {
      console.log(e);
    }
    // setIsLoading(false);
  };

  const handleUnstake = async () => {
    console.log(stakeForAddress, ethers.utils.parseUnits(stakeAmount));
    const estimation = await contract.estimateGas.unstake(stakeForAddress, ethers.utils.parseUnits(stakeAmount));
    const unstakeTx = await contract.unstake(stakeForAddress, ethers.utils.parseUnits(stakeAmount), {
          gasPrice: estimation, 
        });
    await unstakeTx.wait()

    console.log('Stake transaction hash', unstakeTx.hash)
    console.log('Unstake function executed');
    sendMessage('unstaked', stakeForAddress, stakeAmount)
  };

  const handleClaim = async() => {
    console.log('Claim function executed');
    const estimation = await contract.estimateGas.claimTokens();
    const claimTx = await contract.claimTokens({
      gasPrice: estimation
    })

    await claimTx.wait()

    console.log('Claim transaction hash', claimTx.hash)
  };

  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
  };
  const openLeaderBoard = () => {
    setOpenModal(true);
  };
  const closeModal = () => {
    setOpenModal(false);
  };

  async function loadUserData() {
    // const ownStakesEventFilter = await contract.filters.Staked(accountAddress);
    // const ownStakesEvents = await contract.queryFilter(ownStakesEventFilter);
    // console.log("check ownStakesEvents - ", ownStakesEvents);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const currentBlock = await provider.getBlockNumber();
      const ownStakesEvents = contract.filters.Staked(accountAddress);
      const ownStakesEventLogs = await contract.queryFilter(ownStakesEvents, currentBlock - 10000, currentBlock);
      console.log("check ownStakesEventLogs - ", ownStakesEventLogs);
      
      const stakesData = ownStakesEventLogs.map((parsedLog) => {
        return {address: parsedLog.args.candidate, stake: parseFloat(ethers.utils.formatUnits(parsedLog.args.amount)).toFixed(2), credibility: parseFloat(parsedLog.args.cred).toFixed(2)}
      })
      setStakesData(stakesData);
      console.log("check stakesData - ", stakesData);
    } catch(err) {
      console.log("check err stakesData -  ", err)
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const currentBlock = await provider.getBlockNumber();
      const ownStakesEvents = contract.filters.Staked(null, accountAddress);
      const ownStakesEventLogs = await contract.queryFilter(ownStakesEvents, currentBlock - 10000, currentBlock);
      console.log("check ownStakesEventLogs - ", ownStakesEventLogs);
      
      const receivedData = ownStakesEventLogs.map((parsedLog) => {
        return {address: parsedLog.args.staker, received: parseFloat(ethers.utils.formatUnits(parsedLog.args.amount)).toFixed(2), credibilityGained: parseFloat(parsedLog.args.cred).toFixed(2)}
      })
      setReceivedData(receivedData);
      console.log("check receivedData - ", receivedData);
    } catch(err) {
      console.log("check err receivedData -  ", err)
    }


    const tokenBalance = await erc20Contract.balanceOf(accountAddress);
    setTokenBalance(ethers.utils.formatUnits(tokenBalance));

    const stakedTokens = await contract.totalStakedByUser(accountAddress);
    setStakedBalance(ethers.utils.formatUnits(stakedTokens));

    const credScore = await contract.reputation(accountAddress);
    setCredScore(parseInt(credScore));

    try {
      const allocation = await contract.calculateIndividualAllocation(accountAddress);
      setAllocatedTokens(ethers.utils.formatUnits(allocation));
    } catch(err) {
      console.log("check err setAllocatedTokens -  ", err)
    }

  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (contract && accountAddress) {
      loadUserData();
    }
  }, [accountAddress]);

  return (
    <div className='  flex flex-col justify-center w-full md:w-screen font-mono'>
      <div className='flex flex-col items-center justify-between'>
        <div className='dashboard-container  w-full md:w-[90%] p-4 md:p-8 bg-[rgba(112,113,232,0.03)] border-2 border-[#7071E8] mt-4'>
          <div className='top-container flex items-center gap-8 justify-evenly '>
            <div className='address flex gap-2 items-center'>
              <div className='icon'>
                <FaRegUserCircle className='text-xl font-bold text-[#7071E8]' />
              </div>
              <div className='text-lg'>{`${accountAddress.substring(0, 8)}...${accountAddress.substring(accountAddress.length - 4)}`}</div>
            </div>{' '}
            <div className='available-mand'>
              <div className='top-container flex items-center gap-2'>
                <div className='icon'>
                  <FaRegDotCircle className='text-xl font-bold text-[#7071E8]' />
                </div>
                <div className='text-xl text-[#7071E8] font-bold'>
                  Available $DAO
                </div>
              </div>{' '}
              <div className='bottom-container text-3xl font-bold text-center'>
                {parseFloat(tokenBalance).toFixed(2)}
              </div>
            </div>{' '}
            <div className='available-mand'>
              <div className='top-container flex items-center gap-2'>
                <div className='icon'>
                  <IoLockClosedOutline className='text-xl font-bold text-[#7071E8]' />
                </div>
                <div className='text-xl text-[#7071E8] font-bold'>
                  Staked $DAO
                </div>
              </div>{' '}
              <div className='bottom-container text-3xl font-bold  text-center'>
                {parseFloat(stakedBalance).toFixed(2)}
              </div>
            </div>{' '}
            <div className='available-mand'>
              <div className='top-container flex items-center gap-2'>
                <div className='icon'>
                  <MdOutlineVerifiedUser className='text-xl font-bold text-[#7071E8]' />
                </div>
                <div className='text text-xl text-[#7071E8] font-bold'>
                  Credibility score
                </div>
              </div>{' '}
              <div className='bottom-container text-3xl font-bold  text-center'>
                {credScore}
              </div>
            </div>{' '}
          </div>
        </div>
        <div className='main-container  flex flex-col md:flex-row justify-between mt-4 w-[90%]'>
          <div className='credibility-staking-container  bg-[rgba(112,113,232,0.03)] border-2 border-[#7071E8] p-4 md:p-5 shadow-md max-w-full md:max-w-md mb-4 md:mb-0 '>
            <h1 className='text-2xl font-bold mb-4 text-[#7071E8]'>
              Credibility Staking
            </h1>
            <p className='text-sm mb-4'>
              Boost your credibility and earn more rewards! Ask friends to stake
              their $DAO tokens on your address. The more support you get, the
              better your score. Use this interface below to vote for friends
              and help them earn more too!
            </p>

            <div className='flex  mb-4'>
              <button
                onClick={() => setIsStaking(true)}
                className={` px-2  ${
                  isStaking
                    ? 'bg-[#7071E8] text-white'
                    : 'bg-white border-2 text-[#7071E8] border-[#7071E8]'
                }`}
              >
                Stake
              </button>
              <button
                onClick={() => setIsStaking(false)}
                className={`  px-2 ${
                  !isStaking
                    ? 'bg-[#7071E8] text-white'
                    : 'bg-white border-2 text-[#7071E8] border-[#7071E8]'
                }`}
              >
                Unstake
              </button>
            </div>

            <div className='flex flex-col gap-2 mb-4'>
              {isStaking ? (
                <>
                  <label htmlFor='address' className='font-semibold'>
                    Stake for address
                  </label>
                  <input
                    type='text'
                    id='address'
                    placeholder='Enter address'
                    onChange={(e) => setStakeForAddress(e.target.value)}
                    className='p-2 rounded outline-none border-2 border-[#7071E8] bg-white text-black'
                  />

                  <label htmlFor='quantity' className='font-semibold'>
                    Stake Quantity
                  </label>
                  <input
                    type='number'
                    id='quantity'
                    placeholder='Enter quantity'
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className='p-2 rounded border-2 border-[#7071E8]  bg-white text-black'
                  />

                  <button
                    onClick={handleStake}
                    className='w-full bg-[#7071E8] p-3 rounded text-white hover:bg-[#7071E8] transition-colors'
                  >
                    Stake
                  </button>
                </>
              ) : (
                <>
                  <label htmlFor='address' className='font-semibold'>
                    Unstake from address
                  </label>
                  <input
                    type='text'
                    id='address'
                    placeholder='Enter address'
                    onChange={(e) => setStakeForAddress(e.target.value)}
                    className='p-2 rounded border-2 border-[#7071E8]  bg-white text-black'
                  />{' '}
                  <label htmlFor='address' className='font-semibold'>
                    Unstake Quantity
                  </label>
                  <input
                    type='text'
                    id='address'
                    placeholder='Enter quantity '
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className='p-2 rounded border-2 border-[#7071E8]  bg-white text-black'
                  />
                  <button
                    onClick={handleUnstake}
                    className='w-full text-white bg-red-500 p-3 rounded hover:bg-red-700 transition-colors'
                  >
                    Unstake
                  </button>
                </>
              )}
            </div>

            <div className='flex justify-between mt-5 mb-2'>
              <button
                onClick={() => handleTabSwitch('Your Stakes')}
                className={`text-center  flex-1 bg-[#7071E8]  p-2 rounded ${activeTab === 'Your Stakes'
                  ? 'text-white'
                  : 'bg-white border-2 text-[#7071E8] border-[#7071E8] '
                  }`}
              >
                Your Stakes
              </button>
              <button
                onClick={() => handleTabSwitch('Stakes Received')}
                className={`text-center   flex-1 bg-[#7071E8]  p-2 rounded ml-2 ${activeTab === 'Stakes Received'
                  ? 'text-white'
                  : 'bg-white border-2 text-[#7071E8] border-[#7071E8] '
                  }`}
              >
                Stakes Received
              </button>
            </div>

            <div className='overflow-y-auto max-h-[300px] mt-4 border-2 p-2 border-[#7070e86d] '>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b-2 border-[#7070e86d]  '>
                    {activeTab === 'Your Stakes' ? (
                      <>
                        <th className='pb-2 text-left  text-[#7071E8]'>
                          Address
                        </th>
                        <th className='pb-2 text-left   text-[#7071E8]'>
                          Your stake
                        </th>
                        <th className='pb-2   text-[#7071E8]'>
                          Credibility given
                        </th>
                      </>
                    ) : (
                      <>
                        <th className='pb-2   text-[#7071E8]'>Address</th>
                        <th className='pb-2  text-left   text-[#7071E8]'>
                          Stakes <br></br>received
                        </th>
                        <th className='pb-2   text-[#7071E8]'>
                          Credibility <br></br>gained
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'Your Stakes'
                    ? stakesData
                    : receivedData
                  ).map((data, index) => (
                    <tr key={index} className='border-b w-4  text-md'>
                      <td
                        className='py-2 flex items-center gap-2 '
                        onClick={() => copyToClipboard(data.address)}
                      >
                        {formatAddress(data.address)}
                        <PiCopySimpleBold className='text-[#7071E8]' />
                      </td>
                      <td className='py-2 text-center'>
                        {activeTab === 'Your Stakes'
                          ? data.stake
                          : data.received}
                      </td>
                      <td className='py-2 text-center'>
                        {activeTab === 'Your Stakes'
                          ? data.credibility
                          : data.credibilityGained}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className='claim-rewards-container w-full md:w-2/5 bg-[rgba(112,113,232,0.03)] border-2 border-[#7071E8] p-4 '>
            <div className='credibiliy-rewards-container  mb-4'>
              <div className='heading text-2xl font-bold text-[#7071E8]'>
                Credibilty Rewards
              </div>
              <div className='description'>claim your credibility rewards</div>
            </div>
            <div className='claimreward-item-container p-2 w-full flex  items-center justify-start gap-4  '>
              <div className='left-container text-xl bg-white  flex  gap-4  p-2 font-bold border-2 border-[#7071E8]'>
                You have <span className='text-bold text-[#7071E8]'>{parseFloat(allocatedTokens).toFixed(2)}</span>
                $DAO to be claimed
              </div>
              <button className='right-container text-xl p-2 font-semibold text-white bg-[#7071E8]'
                onClick={handleClaim}
              >
                Claim
              </button>
            </div>

            <div className='credibiliy-rewards-container  mb-4 bg-white p-2'>
              <div className='heading text-2xl font-bold text-[#7071E8]'>
                How is credibility calculated?
              </div>
              <div className='description'>
                When your friend stakes $25 DAO tokens on your address you get
                √25 = 5 credibilty points.This is{' '}
                <a
                  target='_blank'
                  href='https://towardsdatascience.com/what-is-quadratic-voting-4f81805d5a06'
                  className='text-[#7071E8] font-semibold underline'
                >
                  Quadratic voting
                </a>
              </div>
              <br></br>
              <div className='description flex flex-col gap-2'>
                Quadratic voting rewards more people supporting you over tokens
                that are staked on you. For example if one friend stakes $100
                DAO tokens on your address you get √100 = 10 credibilty
                points,But if same $100 DAO tokens are staked by 4 different
                friends at $25 each you get 4*√25 = 20 credibilty points.
                <br></br>
                <span className='text-[#7071E8]  font-semibold text-xl'>
                  To increase your credibility get more friends to support you
                </span>
                <div className='overflow-y-auto max-h-[300px] mt-4 border-2 p-2 border-[#7070e86d] '>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b-2 border-[#7070e86d]  '>
                        <th className='pb-2   text-[#7071E8]'>Address</th>
                        <th className='pb-2  text-left   text-[#7071E8]'>
                          Stakes <br></br>received
                        </th>
                        <th className='pb-2   text-[#7071E8]'>
                          Credibility <br></br>gained
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(receivedData
                      ).map((data, index) => (
                        <tr key={index} className='border-b w-4  text-md'>
                          <td
                            className='py-2 flex items-center gap-2 '
                            onClick={() => copyToClipboard(data.address)}
                          >
                            {formatAddress(data.address)}
                            <PiCopySimpleBold className='text-[#7071E8]' />
                          </td>
                          <td className='py-2 text-center'>
                            {data.received}
                          </td>
                          <td className='py-2 text-center'>
                            {data.credibilityGained}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className='relative h-screen w-1/5 bg-white '>
            <div className='sticky top-0 bg-[#7071E8] text-white text-lg font-bold p-4 flex gap-2 items-center justify-center w-full z-10'>
              <RiLiveLine className='text-xl' /> Live Feed
            </div>
            <div className='overflow-y-auto h-full border-2 border-[#7071E8]  feed-items-container'>
              {feedItems.map((item, index) => (
                <div key={index} className={`feed-item transition-opacity duration-500 delay-${index + 1} ${index === 0 ? 'opacity-100' : ''}`}
                // add transition here

                >
                  <LiveFeedItem {...item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {openModal && <LeaderBoardModal closeModal={closeModal} sendMessage={sendMessage} />}
    </div>
  );
}

export default Dashboard;
