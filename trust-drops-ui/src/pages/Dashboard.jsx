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

import {
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
} from '@heroicons/react/outline';

import {
  createLightNode,
  createDecoder,
  createEncoder,
  waitForRemotePeer,
  Protocols,
} from "@waku/sdk"
import protobuf from 'protobufjs';
import { DataContext } from '../context/DataContext';

const ContentTopic = `/trustdrops/debug2/proto`
const Encoder = createEncoder({ contentTopic: ContentTopic })
const decoder = createDecoder(ContentTopic)

const WinkContentTopic = `/trustdrops/debug2/wink/proto`
const WinkEncoder = createEncoder({ contentTopic: WinkContentTopic })
const WinkDecoder = createDecoder(WinkContentTopic)

// Create a message structure using Protobuf
const ChatMessage = new protobuf.Type("ChatMessage")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("voter", 2, "string"))
  .add(new protobuf.Field("votes", 3, "string"))
  .add(new protobuf.Field("message", 4, "string"))
  .add(new protobuf.Field("votedTo", 5, "string"));

const WinkChatMessage = new protobuf.Type("ChatMessageWink")
  .add(new protobuf.Field("timestamp", 1, "uint64"))
  .add(new protobuf.Field("winker", 2, "string"))
  .add(new protobuf.Field("winkedTo", 3, "string"));

function Dashboard() {
  const activityData = [
    {
      type: 'winked',
      from: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2154',
      to: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
    },
    {
      type: 'staked',
      from: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2154',
      to: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
    },
    {
      type: 'unstaked',
      from: '00xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2154',
      to: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
    },
  ];
  const [openModal, setOpenModal] = useState(false);
  const [feedItems, setFeedItems] = useState(activityData);
  const [isStaking, setIsStaking] = useState(true);
  const [activeTab, setActiveTab] = useState('Your Stakes');

  const [stakeForAddress, setStakeForAddress] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');

  const [waku, setWaku] = useState(undefined)
  const [wakuStatus, setWakuStatus] = useState("None")

  const [messages, setMessages] = useState([]);


  const [voteMessages, setVoteMessages] = useState([])
  const [winkMessages, setWinkMessages] = useState([])

  const { accountAddress, contract } = useContext(DataContext);

  console.log("accountAddress", accountAddress)


  const stakesData = [
    {
      address: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
      stake: '100.00 $DAO',
      credibility: '10.00',
    },
    {
      address: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
      stake: '400.00 $DAO',
      credibility: '40.00',
    },
    { address: '0xadfe2...f15d2', stake: '25.00 $DAO', credibility: '5.00' },
    { address: '0xadfe2...f135d', stake: '16.00 $DAO', credibility: '4.00' },
  ];

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setFeedItems((prevItems) => [
        ...prevItems,
        {
          type: 'winked',
          from: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe2',
          to: '0xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xadfe20xad201',
        }, // New mock data
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  const receivedData = [
    {
      address: '0xadfe2...f15d4',
      received: '120.00 $DAO',
      credibilityGained: '15.00',
    },
  ];
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
    const stakeTx = await contract.stake(stakeForAddress, stakeAmount)
    await stakeTx.wait()

    console.log('Stake transaction hash', stakeTx.hash)
    console.log('Stake function executed');
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

  const handleUnstake = () => {
    console.log('Unstake function executed');
  };

  const handleClaim = async() => {
    console.log('Claim function executed');
    const claimTx = await contract.claimTokens()

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

  function decodeMessage(wakuMessage) {
    if (!wakuMessage.payload) return

    const {
      timestamp,
      voter,
      votes,
      message,
      votedTo
    } = ChatMessage.decode(
      wakuMessage.payload
    )

    if (!timestamp || !voter || !message || !votedTo || !votes) return

    const time = new Date()
    time.setTime(Number(timestamp))

    // const utf8Text = bytesToUtf8(text);

    return {
      timestamp: timestamp,
      message: message,
      voter: voter,
      votes: votes,
      votedTo: votedTo
    }
  }

  function decodeWinkMessage(wakuMessage) {
    if (!wakuMessage.payload) return

    const {
      timestamp,
      winker,
      winkedTo
    } = WinkChatMessage.decode(
      wakuMessage.payload
    )

    if (!timestamp || !winker || !winkedTo) return

    const time = new Date()
    time.setTime(Number(timestamp))

    // const utf8Text = bytesToUtf8(text);

    return {
      timestamp: timestamp,
      winker: winker,
      winkedTo: winkedTo
    }
  }

  // Send the message using Light Push
  async function sendMessage() {
    const timestamp = new Date()
    const time = timestamp.getTime()

    // Encode to protobuf
    const protoMsg = ChatMessage.create({
      timestamp: time,
      voter: accountAddress,
      message: "inputMessage",
      votedTo: stakeForAddress,
      votes: stakeAmount,
    })
    const serialisedMessage = ChatMessage.encode(protoMsg).finish()

    // Send the message using Light Push
    await waku.lightPush.send(Encoder, {
      payload: serialisedMessage,
    });
  }

  async function sendWinkMessage() {
    const timestamp = new Date()
    const time = timestamp.getTime()

    // Encode to protobuf
    const protoMsg = WinkChatMessage.create({
      timestamp: time,
      winker: "Anonymous",
      winkedTo: "Another_Anon",
    })
    const serialisedMessage = WinkChatMessage.encode(protoMsg).finish()

    // Send the message using Light Push
    await waku.lightPush.send(WinkEncoder, {
      payload: serialisedMessage,
    });
  }


  useEffect(() => {
    console.log('Waku setup')
    if (wakuStatus !== "None") return

    setWakuStatus("Starting")
    console.log('Waku status', wakuStatus)

    createLightNode({ defaultBootstrap: true }).then((waku) => {
      waku.start().then(() => {
        setWaku(waku)
        setWakuStatus("Connecting")
      })
    })
  }, [waku, wakuStatus])

  useEffect(() => {
    if (!waku) return

    // We do not handle disconnection/re-connection in this example
    if (wakuStatus === "Connected") return

    waitForRemotePeer(waku, [
      Protocols.LightPush,
      Protocols.Filter,
      Protocols.Store,
    ]).then(() => {
      // We are now connected to a store node
      setWakuStatus("Connected")
    })
  }, [waku, wakuStatus])

  useEffect(() => {
    if (wakuStatus !== "Connected") return
    (async () => {
      const startTime = new Date()
      // 7 days/week, 24 hours/day, 60min/hour, 60secs/min, 100ms/sec
      startTime.setTime(startTime.getTime() - 7 * 24 * 60 * 60 * 1000)

      try {
        for await (const messagesPromises of waku.store.queryGenerator(
          [decoder],
          {
            timeFilter: { startTime, endTime: new Date() },
            pageDirection: "forward",
          }
        )) {
          const messages = await Promise.all(
            messagesPromises.map(async (p) => {
              const msg = await p
              return decodeMessage(msg)
            })
          )

          console.log({ messages })
          setMessages((currentMessages) => {
            return currentMessages.concat(messages.filter(Boolean).reverse())
          })
        }
      } catch (e) {
        console.log("Failed to retrieve messages", e)
        setWakuStatus("Error Encountered")
      }
    })()
  }, [waku, wakuStatus])

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className='  flex flex-col justify-center w-full md:w-screen font-mono'>
      <div className='flex flex-col items-center justify-between'>
        <div className='dashboard-container  w-full md:w-[90%] p-4 md:p-8 bg-[rgba(112,113,232,0.03)] border-2 border-[#7071E8] mt-4'>
          <div className='top-container flex items-center gap-8 justify-evenly '>
            <div className='address flex gap-2 items-center'>
              <div className='icon'>
                <FaRegUserCircle className='text-xl font-bold text-[#7071E8]' />
              </div>
              <div className='text-lg'>0xfadsfe2...d154</div>
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
                3133.50
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
                320
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
                100.50
              </div>
            </div>{' '}
            <div className='available-mand ' onClick={openLeaderBoard}>
              <div className='top-container flex items-center gap-2'>
                <div className='icon'>
                  <MdOutlineLeaderboard className='text-xl font-bold text-[#7071E8]' />
                </div>
                <div className=' text-xl text-[#7071E8] font-bold'>
                  Your rank
                </div>
              </div>{' '}
              <div className='bottom-container underline text-3xl font-bold  text-center'>
                # 1
              </div>
            </div>
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
                    className='p-2 rounded border-2 border-[#7071E8]  bg-white text-black'
                  />{' '}
                  <label htmlFor='address' className='font-semibold'>
                    Unstake Quantity
                  </label>
                  <input
                    type='text'
                    id='address'
                    placeholder='Enter quantity '
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
                You have <span className='text-bold text-[#7071E8]'>100</span>
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
            </div>
          </div>
          <div className='relative h-screen w-1/5 bg-white '>
            <div className='sticky top-0 bg-[#7071E8] text-white text-lg font-bold p-4 flex gap-2 items-center justify-center w-full z-10'>
              <RiLiveLine className='text-xl' /> Live Feed
            </div>
            <div className='overflow-y-auto h-full border-2 border-[#7071E8]  '>
              {feedItems.map((item, index) => (
                <div key={index} className='flex min-w-max p-2'>
                  <LiveFeedItem {...item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {openModal && <LeaderBoardModal closeModal={closeModal} />}
    </div>
  );
}

export default Dashboard;
