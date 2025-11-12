import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import type { SatisfactionSurvey } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Sepolia Testnet Integration Tests
 * 
 * Prerequisites:
 * 1. Set PRIVATE_KEY in Hardhat vars for Sepolia deployment
 * 2. Ensure Sepolia ETH balance for gas fees
 * 3. Deploy contract to Sepolia: npx hardhat deploy --network sepolia
 * 
 * Run: npx hardhat test test/SatisfactionSurveySepolia.ts --network sepolia
 */
describe("SatisfactionSurvey - Sepolia", function () {
  let contract: SatisfactionSurvey;
  let deployer: HardhatEthersSigner;

  before(async function () {
    // Skip if not on Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111n) {
      this.skip();
    }

    [deployer] = await ethers.getSigners();
    
    // Get deployed contract
    const deployment = await deployments.get("SatisfactionSurvey");
    contract = await ethers.getContractAt("SatisfactionSurvey", deployment.address) as unknown as SatisfactionSurvey;
    
    console.log("Testing SatisfactionSurvey at:", deployment.address);
    console.log("Deployer:", deployer.address);
  });

  describe("Deployment Verification", function () {
    it("Should have correct decrypt manager", async function () {
      const decryptManager = await contract.decryptManager();
      console.log("Decrypt Manager:", decryptManager);
      expect(decryptManager).to.be.properAddress;
    });

    it("Should be able to read global aggregates", async function () {
      const [total, count] = await contract.getGlobalAggregates();
      console.log("Global Total Handle:", total);
      console.log("Global Count Handle:", count);
      expect(total).to.not.equal(0n);
      expect(count).to.not.equal(0n);
    });

    it("Should be able to read department aggregates", async function () {
      const deptId = 0; // Marketing
      const [total, count] = await contract.getDepartmentAggregates(deptId);
      console.log(`Department ${deptId} Total Handle:`, total);
      console.log(`Department ${deptId} Count Handle:`, count);
      expect(total).to.not.equal(0n);
      expect(count).to.not.equal(0n);
    });
  });

  describe("Submit Response (Mock)", function () {
    it("Should accept encrypted response submission", async function () {
      // Note: Real FHEVM encryption requires fhevmjs and proper setup
      // This is a mock test to verify contract interaction
      const mockEncryptedScore = ethers.zeroPadValue("0x01", 32);
      const mockEncryptedOne = ethers.zeroPadValue("0x01", 32);
      const mockProof = "0x";
      const deptId = 0; // Marketing

      console.log("Submitting mock response...");
      
      const tx = await contract.submitResponse(
        mockEncryptedScore,
        mockProof,
        deptId,
        mockEncryptedOne,
        mockProof
      );

      const receipt = await tx.wait();
      console.log("Transaction hash:", receipt?.hash);
      console.log("Gas used:", receipt?.gasUsed.toString());
      
      expect(receipt?.status).to.equal(1);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to update decrypt manager", async function () {
      const currentManager = await contract.decryptManager();
      
      // Set to self (no change, just testing permission)
      const tx = await contract.setDecryptManager(currentManager);
      const receipt = await tx.wait();
      
      console.log("Updated decrypt manager, tx:", receipt?.hash);
      expect(receipt?.status).to.equal(1);
    });
  });

  describe("User Authorization", function () {
    it("Should allow granting decrypt permissions", async function () {
      const deptIds = [0, 1, 2]; // Marketing, Sales, Engineering
      
      console.log("Granting decrypt permissions to deployer...");
      
      const tx = await contract.allowUserToDecrypt(deployer.address, deptIds);
      const receipt = await tx.wait();
      
      console.log("Permissions granted, tx:", receipt?.hash);
      expect(receipt?.status).to.equal(1);
    });
  });
});

