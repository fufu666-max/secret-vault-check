import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import type { SatisfactionSurvey } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

interface Signers {
  deployer: HardhatEthersSigner;
  employee1: HardhatEthersSigner;
  employee2: HardhatEthersSigner;
}

/**
 * SatisfactionSurvey Contract Tests
 * 
 * Note: These tests verify contract deployment and basic functionality.
 * Full FHEVM encryption/decryption tests require @fhevm/hardhat-plugin
 * which is currently not available. For now, we test with mock encrypted values.
 * 
 * For production testing with real FHEVM:
 * 1. Install @fhevm/hardhat-plugin when available
 * 2. Use fhevm.createEncryptedInput() for encryption
 * 3. Use fhevm.userDecryptEuint() for decryption
 */
describe("SatisfactionSurvey", function () {
  let contract: SatisfactionSurvey;
  let contractAddress: string;
  let signers: Signers;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      employee1: ethSigners[1],
      employee2: ethSigners[2],
    };
  });

  beforeEach(async function () {
    // Deploy contract
    await deployments.fixture(["SatisfactionSurvey"]);
    const deployment = await deployments.get("SatisfactionSurvey");
    contractAddress = deployment.address;
    contract = await ethers.getContractAt("SatisfactionSurvey", contractAddress) as unknown as SatisfactionSurvey;
  });

  describe("Deployment", function () {
    it("Should set the correct decrypt manager", async function () {
      expect(await contract.decryptManager()).to.equal(signers.deployer.address);
    });

    it("Should initialize with zero aggregates", async function () {
      const [total, count] = await contract.getGlobalAggregates();
      // Encrypted zero values should not be 0x0
      expect(total).to.not.equal(ethers.ZeroHash);
      expect(count).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Submit Response", function () {
    it("Should allow submitting encrypted satisfaction score", async function () {
      const deptId = 1; // Sales
      
      // Mock encrypted values (in production, use fhevm.createEncryptedInput)
      const mockEncryptedScore = ethers.zeroPadValue("0x08", 32); // Mock for score 8
      const mockEncryptedOne = ethers.zeroPadValue("0x01", 32);   // Mock for 1
      const mockProof = "0x";

      const tx = await contract
        .connect(signers.employee1)
        .submitResponse(
          mockEncryptedScore,
          mockProof,
          deptId,
          mockEncryptedOne,
          mockProof
        );

      await expect(tx).to.emit(contract, "ResponseSubmitted");
    });

    it("Should allow multiple employees to submit responses", async function () {
      const deptId = 0; // Marketing
      const mockScore = ethers.zeroPadValue("0x07", 32);
      const mockOne = ethers.zeroPadValue("0x01", 32);
      const mockProof = "0x";

      // Employee 1 submits
      await contract
        .connect(signers.employee1)
        .submitResponse(mockScore, mockProof, deptId, mockOne, mockProof);

      // Employee 2 submits
      await contract
        .connect(signers.employee2)
        .submitResponse(mockScore, mockProof, deptId, mockOne, mockProof);

      // Verify aggregates exist (encrypted, so we can't check exact values without decryption)
      const [globalTotal, globalCount] = await contract.getGlobalAggregates();
      expect(globalTotal).to.not.equal(ethers.ZeroHash);
      expect(globalCount).to.not.equal(ethers.ZeroHash);
    });

    it("Should update department aggregates after submission", async function () {
      const deptId = 2; // Engineering
      const mockScore = ethers.zeroPadValue("0x06", 32);
      const mockOne = ethers.zeroPadValue("0x01", 32);
      const mockProof = "0x";

      const [deptTotalBefore] = await contract.getDepartmentAggregates(deptId);

      await contract
        .connect(signers.employee1)
        .submitResponse(mockScore, mockProof, deptId, mockOne, mockProof);

      const [deptTotalAfter] = await contract.getDepartmentAggregates(deptId);
      
      // The encrypted values should be different after submission
      expect(deptTotalAfter).to.not.equal(deptTotalBefore);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to update decrypt manager", async function () {
      const newManager = signers.employee1.address;
      await contract.connect(signers.deployer).setDecryptManager(newManager);
      expect(await contract.decryptManager()).to.equal(newManager);
    });

    it("Should not allow non-owner to update decrypt manager", async function () {
      await expect(
        contract.connect(signers.employee1).setDecryptManager(signers.employee2.address)
      ).to.be.reverted;
    });
  });

  describe("User Decrypt Authorization", function () {
    it("Should allow granting decrypt permission to users", async function () {
      const deptIds = [0, 1, 2];
      
      await expect(
        contract.allowUserToDecrypt(signers.employee1.address, deptIds)
      ).to.not.be.reverted;
    });

    it("Should allow multiple departments in permission grant", async function () {
      const deptIds = [0, 1, 2, 3, 4]; // All departments
      
      const tx = await contract.allowUserToDecrypt(signers.employee2.address, deptIds);
      await tx.wait();
      
      // Transaction should succeed
      expect(tx).to.not.be.undefined;
    });
  });
});

