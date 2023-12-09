import { ethers } from "hardhat";

async function main() {

  const signer = await ethers.getSigners();

  const daoToken = await ethers.deployContract("DAOToken", [signer[0].address]);
  await daoToken.waitForDeployment();
  console.log(
    `Dao token deployed to ${daoToken.target}`
  );

  // Deploying anon-aadhaar verification contracts
  const verifier = await ethers.deployContract("Verifier");
  await verifier.waitForDeployment();
  const _verifierAddress = verifier.getAddress();
  const appId = BigInt(
    "1054725213937889195122827708128950524547440836608"
  ).toString();
  const anonAadhaarVerifier = await ethers.deployContract(
    "AnonAadhaarVerifier",
    [_verifierAddress, appId]
  );
  await anonAadhaarVerifier.waitForDeployment();
  const _anonAadhaarVerifierAddress = anonAadhaarVerifier.getAddress();
  
  // Deploying trust drops
  const trustDrops = await ethers.deployContract("TrustDrops", [daoToken.target, _anonAadhaarVerifierAddress]);
  await trustDrops.waitForDeployment();
  console.log(
    `Trust drops deployed to ${trustDrops.target}`
  );


  const mintTx = await daoToken.mint(trustDrops.target, "20000000000000000000000000");
  await mintTx.wait();
  console.log("mintTx", mintTx);

//   const transferTx = await trustDrops.tempTransfer();
//   await transferTx.wait();
//   console.log("transferTx", transferTx);

//   const a = [
//     "12460614951749606740501097818281730098061785595547104139870274171743997833900",
//     "3568632853958752578220504855675957207202175595901115642791871483631475850820"
// ]

//   const b = [
//     [
//         "11892295831296192735735222041731684759634476657978336897560049983317203976450",
//         "16168013026631615738122512427276525543138061161612020416199137138062484789960"
//     ],
//     [
//         "17221573548125612224725767369946531630615979465095503377919353129484490023145",
//         "16504315286688790020260199073816338467426746956868573044772989298289013791467"
//     ]
// ]

//   const c = [
//     "605910688009925423209876795622298953029385943953276435242010835825053494157",
//     "15889016030250170637866666220875082468455121788194670293495370514737465775938"
// ]

//   const inputs = [
//     "16385199687898445297005784135195987580866879229338863912313777879098879451158",
//     "7873437550307926165",
//     "13477973865601442634",
//     "1458039844062964693",
//     "7398834103216365279",
//     "12384545621709803393",
//     "14386943674931866539",
//     "2263535879398593693",
//     "3600615314669141235",
//     "13096864295899435543",
//     "8628516684870087465",
//     "343547845356630073",
//     "10551339838260165529",
//     "10902964543149146524",
//     "4056605863534888131",
//     "17764439819646281378",
//     "5137209503034180614",
//     "2378644744463171581",
//     "6676194234629029970",
//     "5432490752817224179",
//     "12846544745292400088",
//     "3434369281354788863",
//     "1533621309896666264",
//     "18225262974130476508",
//     "10073981006187788275",
//     "8114837903070988230",
//     "7632965149656839367",
//     "2714276348828835947",
//     "615665516684210923",
//     "1084184375765016924",
//     "17345989530239433420",
//     "8106155243977228977",
//     "11705466821727348154",
//     "1054725213937889195122827708128950524547440836608"
// ]

//   const verifyTx = await trustDrops.verifyAadhaar(a, b, c, inputs);
//   await verifyTx.wait();
//   console.log("check verifytx - ", verifyTx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
