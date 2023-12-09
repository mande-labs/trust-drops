import React, { useState } from 'react';
import { MdOutlineLeaderboard, MdOutlineVerifiedUser } from 'react-icons/md';
import {
  FaRegUserCircle,
  FaRegDotCircle,
  FaRegSmileWink,
} from 'react-icons/fa';
import { IoLockClosedOutline } from 'react-icons/io5';
import { TbUserUp } from 'react-icons/tb';
import { PiCopySimpleBold } from 'react-icons/pi';

const LeaderBoardModal = ({ closeModal }) => {
  // const [isModalOpen, setModalOpen] = useState(openModal);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const formatAddress = (address) => {
    const maxLength = 18;
    return address.length > maxLength
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : address;
  };

  // Example dummy data
  const dummyData = Array.from({ length: 50 }, (_, index) => ({
    rank: `#${index + 1}`,
    wallet: `0xdummyWalletAddress_${index}`,
    credibilityScore: Math.round(Math.random() * 1000),
    availableSMND: Math.round(Math.random() * 100),
    lockedSMND: Math.round(Math.random() * 100),
    credibilityGiven: Math.round(Math.random() * 100),
  }));

  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = dummyData.slice(firstItemIndex, lastItemIndex);

  const totalPages = Math.ceil(dummyData.length / itemsPerPage);

  const copyToClipboard = async (wallet) => {
    try {
      await navigator.clipboard.writeText(wallet);
      // Display some notification or change the icon if needed
    } catch (err) {
      // Handle the error case
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // if (!isModalOpen) return null;

  return (
    <div className='fixed inset-0 z-20 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-start '>
      <div className=' px-4 sm:px-8 '>
        <div className='py-8'>
          <div className='shadow overflow-hidden rounded border-b border-gray-200'>
            <table className='w-full bg-white'>
              <thead className='text-white bg-[#7071E8] border-b'>
                <tr>
                  <th className='text-left py-3 px-4 uppercase font-semibold text-sm  '>
                    <MdOutlineLeaderboard className='h-4 mr-2 w-4 inline-block ml-2' />
                    Rank
                  </th>
                  <th className='text-left py-3 px-4 uppercase font-semibold text-sm '>
                    <FaRegUserCircle className='h-4 mr-2 w-4 inline-block ml-2' />
                    Wallet address
                  </th>

                  <th className='text-left py-3 px-4 uppercase font-semibold text-sm'>
                    <MdOutlineVerifiedUser className='h-4 w-4 mr-2 inline-block ml-2' />
                    Credibility score
                  </th>
                  <th className='text-left py-3 px-4 uppercase font-semibold text-sm '>
                    <FaRegDotCircle className='h-4 w-4 mr-2 inline-block ml-2' />
                    Available $DAO
                  </th>
                  <th className='text-left py-3 px-4 uppercase font-semibold text-sm'>
                    <IoLockClosedOutline className='h-4 mr-2 w-4 inline-block ml-2' />
                    Locked $DAO
                  </th>
                  <th className='text-left py-3 px-4 uppercase font-semibold text-sm'>
                    <TbUserUp className='h-4 mr-2 w-4 inline-block ml-2' />
                    Credibility given
                  </th>
                </tr>
              </thead>
              <tbody className='text-gray-700'>
                {currentItems.map((item, index) => (
                  <tr key={index}>
                    <td className='text-center py-3 px-4 items '>
                      {item.rank}
                    </td>
                    <td className='text-left py-3  px-4 flex  items-center'>
                      <div className=''>{formatAddress(item.wallet)}</div>
                      <PiCopySimpleBold
                        className='h-5 w-5 ml-2 mr-3 text-[#7071E8] cursor-pointer'
                        onClick={() => copyToClipboard(item.wallet)}
                      />
                      <FaRegSmileWink
                        title='wink this user to request stake'
                        className='text-center cursor-pointer text-[#7071E8] hover:bg-[#7071E8] rounded-full hover:text-white hover:scale-105 hover:border-2 hover:border-[#7071E8]'
                      />
                    </td>

                    <td className=' py-3 px-4 text-center'>
                      {item.credibilityScore}
                    </td>
                    <td className='text-center py-3 px-4'>
                      {item.availableSMND}
                    </td>
                    <td className='text-center py-3 px-4'>{item.lockedSMND}</td>
                    <td className='text-center py-3 px-4'>
                      {item.credibilityGiven}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='flex flex-col xs:flex-row items-center xs:justify-between mt-4'>
            <div className='flex items-center'>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className='w-full p-2 border text-base rounded-l-xl text-gray-600 bg-white hover:bg-gray-100'
              >
                <span className=''>Previous</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`w-full p-2 border-t border-b border-r text-base rounded-none hover:bg-gray-100 text-gray-600 bg-white ${
                    currentPage === i + 1 ? 'text-blue-600 bg-blue-100' : ''
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='w-full p-2 border text-base rounded-r-xl text-gray-600 bg-white hover:bg-gray-100'
              >
                <span className=''>Next</span>
              </button>
            </div>
            <div className='inline-flex mt-2 xs:mt-0'>
              <button
                onClick={closeModal}
                className='text-white bg-red-600 hover:bg-red-700 font-bold py-2 px-4 rounded'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderBoardModal;
