import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("survey:address", "Prints the SatisfactionSurvey address").setAction(async function (_args: TaskArguments, hre) {
  const { deployments } = hre;
  const deployment = await deployments.get("SatisfactionSurvey");
  console.log(`SatisfactionSurvey address is ${deployment.address}`);
});

task("survey:submit", "Submit an encrypted satisfaction score")
  .addParam("value", "Satisfaction score (integer, e.g., 1..10)")
  .addParam("dept", "Department id (integer)")
  .addOptionalParam("address", "Optionally specify the SatisfactionSurvey contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const value = parseInt(args.value);
    const dept = parseInt(args.dept);
    if (isNaN(value) || value < 1 || value > 10) {
      throw new Error("Value must be an integer between 1 and 10");
    }
    if (isNaN(dept) || dept < 0) {
      throw new Error("Department id must be a non-negative integer");
    }

    const deployment = args.address ? { address: args.address } : await deployments.get("SatisfactionSurvey");
    console.log(`SatisfactionSurvey: ${deployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];
    const contract = await ethers.getContractAt("SatisfactionSurvey", deployment.address);

    const encrypted = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .add32(value)
      .add32(1)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .submitResponse(encrypted.handles[0], encrypted.inputProof, dept, encrypted.handles[1], encrypted.inputProof);

    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);
    console.log(`Submitted value=${value} dept=${dept}`);
  });

task("survey:get-global", "Get and decrypt global aggregates (total, count)")
  .addOptionalParam("address", "Optionally specify the SatisfactionSurvey contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const deployment = args.address ? { address: args.address } : await deployments.get("SatisfactionSurvey");
    const signers = await ethers.getSigners();
    const signer = signers[0];
    const contract = await ethers.getContractAt("SatisfactionSurvey", deployment.address);

    const [encTotal, encCount] = await contract.getGlobalAggregates();
    console.log(`Encrypted total: ${encTotal}`);
    console.log(`Encrypted count: ${encCount}`);

    if (encTotal === ethers.ZeroHash || encCount === ethers.ZeroHash) {
      console.log("No data submitted yet");
      return;
    }

    const clearTotal = await fhevm.userDecryptEuint(FhevmType.euint32, encTotal, deployment.address, signer);
    const clearCount = await fhevm.userDecryptEuint(FhevmType.euint32, encCount, deployment.address, signer);
    console.log(`Clear total: ${clearTotal}`);
    console.log(`Clear count: ${clearCount}`);
  });

task("survey:get-dept", "Get and decrypt department aggregates (total, count)")
  .addParam("dept", "Department id (integer)")
  .addOptionalParam("address", "Optionally specify the SatisfactionSurvey contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const dept = parseInt(args.dept);
    if (isNaN(dept) || dept < 0) {
      throw new Error("Department id must be a non-negative integer");
    }

    const deployment = args.address ? { address: args.address } : await deployments.get("SatisfactionSurvey");
    const signers = await ethers.getSigners();
    const signer = signers[0];
    const contract = await ethers.getContractAt("SatisfactionSurvey", deployment.address);

    const [encTotal, encCount] = await contract.getDepartmentAggregates(dept);
    console.log(`Department ${dept}:`);
    console.log(`Encrypted total: ${encTotal}`);
    console.log(`Encrypted count: ${encCount}`);

    if (encTotal === ethers.ZeroHash || encCount === ethers.ZeroHash) {
      console.log("No data for this department yet");
      return;
    }

    const clearTotal = await fhevm.userDecryptEuint(FhevmType.euint32, encTotal, deployment.address, signer);
    const clearCount = await fhevm.userDecryptEuint(FhevmType.euint32, encCount, deployment.address, signer);
    console.log(`Clear total: ${clearTotal}`);
    console.log(`Clear count: ${clearCount}`);
  });

