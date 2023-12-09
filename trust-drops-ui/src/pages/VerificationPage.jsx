/* global BigInt */
import React, { useEffect, useContext } from 'react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { LogInWithAnonAadhaar, useAnonAadhaar } from 'anon-aadhaar-react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCopyIcon, ChevronDownIcon } from '@heroicons/react/outline';
import { IoFingerPrintOutline } from 'react-icons/io5';
import { exportCallDataGroth16FromPCD } from "anon-aadhaar-pcd";
import { DataContext } from '../context/DataContext';

function VerificationPage() {
  const [anonAadhaar] = useAnonAadhaar();
  const navigate = useNavigate();
  const onDrop = useCallback((acceptedFiles) => {
    // Do something with the dropped files
    console.log(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  const { contract } = useContext(DataContext);

  // useEffect(() => {
  //   console.log('Anon Aadhaar status: ', anonAadhaar.status);
  //   if ((anonAadhaar.status = 'logged-in')) {
  //     navigate('/dashboard');
  //   }
  // }, [anonAadhaar]);

  const verifyAadhaarHandler = async (a, b, c, Input) => {
    try {
      const estimation = await contract.estimateGas.verifyAadhaar(a, b, c, Input);
      console.log("check estimation here - ", estimation);

      const verifyTx = await contract.verifyAadhaar(a, b, c, Input, 
        {
          gasPrice: estimation, 
        });

      const verifyReceipt = await verifyTx.wait();
      console.log(verifyReceipt);

      if (verifyReceipt) {
        navigate('/dashboard');
      } else {
        console.log('Verification failed');
      }
    } catch (err) {
      console.log(err);
    }

  }

  useEffect(() => {
    console.log('Anon Aadhaar status: ', anonAadhaar.status);
    if ((anonAadhaar.status === 'logged-in')) {
      (async () => {
        const { a, b, c, Input } = await exportCallDataGroth16FromPCD(
          anonAadhaar.pcd
        );

        console.log("check a, b, c and Input below -- ");
        verifyAadhaarHandler(a, b, c, Input)
        console.log(a, b, c, Input);
      })();
    }
  }, [anonAadhaar]);

  return (
    <div className='flex flex-col items-center w-screen pt-8 font-mono'>
      <div className='verification-container p-8 w-[90%] bg-[rgba(112,113,232,0.03)]'>
        <div className='heading-container flex items-center gap-4'>
          <div className='icon text-5xl'>
            <IoFingerPrintOutline className='text-white rounded-full p-2 bg-[#7071E8]' />
          </div>
          <div className='right-container'>
            <div className='heading-text text-3xl font-semibold text-[#7071E8]'>
              Aadhaar verification
            </div>
            <div className='description-text  '>
              Anon Aadhaar lets you prove your identity by generating a ZK Proof
              verifying your Aadhaar card was signed with the Indian government
              public key. your aadhaar will not be stored.{' '}
            </div>
          </div>
        </div>
        <div className='instructions-container m-4 flex flex-col gap-4 p-4 bg-white'>
          <div className='heading-text font-black '>
            Follow these steps to verify get verified :
          </div>
          <div className='point1-container flex gap-8'>
            <div className='point-number font-bold flex self-start  text-white px-2 rounded-3xl bg-[#7071E8]'>
              1
            </div>
            <div className='point-text-container'>
              <div className='top-container font-bold'>
                Download Your e-Aadhar :
              </div>
              <div className='bottom-container mt-2 flex gap-4'>
                <div className='pointi flex  gap-2'>
                  <div className='point-number font-bold flex self-start px-[10px] rounded-3xl bg-white text-[#7071E8] border-2 border-[#7071E8]'>
                    i
                  </div>
                  <div className='point-text'>Visit the UIDAI website here</div>
                </div>{' '}
                <div className='pointii  flex  gap-2'>
                  <div className='point-number font-bold flex self-start   px-2 rounded-3xl bg-white text-[#7071E8] border-2 border-[#7071E8]'>
                    ii
                  </div>
                  <div className='point-text'>
                    Enter your Aadhar details, verify via OTP
                  </div>
                </div>{' '}
                <div className='pointiii  flex  gap-2'>
                  <div className='point-number font-bold flex self-start   px-2 rounded-3xl bg-white text-[#7071E8] border-2 border-[#7071E8]'>
                    iii
                  </div>
                  <div className='point-text'>
                    and download your e-Aadhar PDF.
                  </div>
                </div>
              </div>
            </div>
          </div>{' '}
          <div className='point1-container flex gap-8'>
            <div className='point-number font-bold self-start  text-white px-2 rounded-3xl bg-[#7071E8]'>
              2
            </div>
            <div className='point-text-container'>
              <div className='top-container font-bold'>
                Upload Your e-Aadhar PDF and Enter Your File Password
              </div>
              <div className='bottom-container flex '>
                <div className='point mt-2 '>
                  <div className='point-number font-[600]'>
                    Password Format:
                  </div>
                  <div className='point-text'>
                    Use the first four letters of your name in uppercase plus
                    your birth year as the password. Example: For 'Arjun' born
                    in 1980, it's ARJU1980.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='point1-container flex gap-8'>
            <div className='point-number font-bold self-start  text-white px-2 rounded-3xl bg-[#7071E8]'>
              3
            </div>
            <div className='point-text-container'>
              <div className='bottom-container flex '>
                <div className='point  '>
                  <div className='point-number font-[600]'>Final Step:</div>
                  <div className='point-text'>
                    Click the 'Verify' button and wait upto 5 mins for the
                    verification process to complete. please don’t leave the
                    page.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='upload-container flex flex-col gap-4  items-center '>
          <LogInWithAnonAadhaar />
          <p>verification status: {anonAadhaar?.status}</p>
          {/* <div className='heading-text'>Upload your aadhar pdf</div>
          <div className='dragndrop-container flex flex-col items-center'>
            <div
              {...getRootProps()}
              className={`drop-file-container h-40 flex flex-col items-center justify-center bg-[rgba(112,113,232,0.16)] ${
                isDragActive ? 'border-[#7071E8]' : ''
              }`}
            >
              {' '}
              <input {...getInputProps()} />
              <button className='button-choose-file text-white bg-[#7071E8] px-4 py-2 text-center  max-w-[180px]  flex  justify-center  '>
                Choose file
              </button>
              <div className='text-drag-file'>
                {isDragActive ? 'Drop the file here' : 'or drag file in here'}
              </div>
            </div>
          </div>
          <div className='heading-text'>Enter your Aadhaar pdf password</div>
          <input
            type='password'
            className='w-full p-2 border-2 border-[#7071E8]'
          />
          <button className='verify-btn bg-[#7071E8] px-4 py-2   text-white  text-center self-end  mt-4  '>
            Verify
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default VerificationPage;
