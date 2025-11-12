import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";
import type { SatisfactionSurvey } from "../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";

interface Signers {
  deployer: HardhatEthersSigner;
  employee1: HardhatEthersSigner;
  employee2: HardhatEthersSigner;
}

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
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn("This test suite requires FHEVM mock environment");
      this.skip();
    }

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
      const satisfactionScore = 8; // Rating 8/10

      // Encrypt the satisfaction score
      const encryptedScore = await fhevm
        .createEncryptedInput(contractAddress, signers.employee1.address)
        .add32(satisfactionScore)
        .encrypt();

      // Encrypt the constant 1 for counting
      const encryptedOne = await fhevm
        .createEncryptedInput(contractAddress, signers.employee1.address)
        .add32(1)
        .encrypt();

      const tx = await contract
        .connect(signers.employee1)
        .submitResponse(
          encryptedScore.handles[0],
          encryptedScore.inputProof,
          deptId,
          encryptedOne.handles[0],
          encryptedOne.inputProof
        );

      await expect(tx).to.emit(contract, "ResponseSubmitted");
    });

    it("Should correctly aggregate multiple encrypted responses", async function () {
      const deptId = 0; // Marketing
      const score1 = 7;
      const score2 = 9;

      // Employee 1 submits
      const enc1Score = await fhevm
        .createEncryptedInput(contractAddress, signers.employee1.address)
        .add32(score1)
        .encrypt();
      const enc1One = await fhevm
        .createEncryptedInput(contractAddress, signers.employee1.address)
        .add32(1)
        .encrypt();

      await contract
        .connect(signers.employee1)
        .submitResponse(
          enc1Score.handles[0],
          enc1Score.inputProof,
          deptId,
          enc1One.handles[0],
          enc1One.inputProof
        );

      // Employee 2 submits
      const enc2Score = await fhevm
        .createEncryptedInput(contractAddress, signers.employee2.address)
        .add32(score2)
        .encrypt();
      const enc2One = await fhevm
        .createEncryptedInput(contractAddress, signers.employee2.address)
        .add32(1)
        .encrypt();

      await contract
        .connect(signers.employee2)
        .submitResponse(
          enc2Score.handles[0],
          enc2Score.inputProof,
          deptId,
          enc2One.handles[0],
          enc2One.inputProof
        );

      // Decrypt and verify global aggregates
      const [globalTotal, globalCount] = await contract.getGlobalAggregates();
      const decryptedTotal = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        globalTotal,
        contractAddress,
        signers.deployer
      );
      const decryptedCount = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        globalCount,
        contractAddress,
        signers.deployer
      );

      expect(decryptedTotal).to.equal(score1 + score2);
      expect(decryptedCount).to.equal(2);

      // Verify average
      const average = Number(decryptedTotal) / Number(decryptedCount);
      expect(average).to.equal((score1 + score2) / 2);
    });

    it("Should correctly aggregate department-specific responses", async function () {
      const deptId = 2; // Engineering
      const score1 = 6;
      const score2 = 8;
      const score3 = 10;

      // Submit 3 responses to Engineering department
      for (const [signer, score] of [
        [signers.employee1, score1],
        [signers.employee2, score2],
        [signers.deployer, score3],
      ]) {
        const encScore = await fhevm
          .createEncryptedInput(contractAddress, signer.address)
          .add32(score)
          .encrypt();
        const encOne = await fhevm
          .createEncryptedInput(contractAddress, signer.address)
          .add32(1)
          .encrypt();

        await contract
          .connect(signer)
          .submitResponse(
            encScore.handles[0],
            encScore.inputProof,
            deptId,
            encOne.handles[0],
            encOne.inputProof
          );
      }

      // Decrypt and verify department aggregates
      const [deptTotal, deptCount] = await contract.getDepartmentAggregates(deptId);
      const decryptedTotal = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        deptTotal,
        contractAddress,
        signers.deployer
      );
      const decryptedCount = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        deptCount,
        contractAddress,
        signers.deployer
      );

      expect(decryptedTotal).to.equal(score1 + score2 + score3);
      expect(decryptedCount).to.equal(3);
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

    it("Should allow users to decrypt after permission granted", async function () {
      const deptId = 1;
      const score = 7;

      // Submit a response
      const encScore = await fhevm
        .createEncryptedInput(contractAddress, signers.employee1.address)
        .add32(score)
        .encrypt();
      const encOne = await fhevm
        .createEncryptedInput(contractAddress, signers.employee1.address)
        .add32(1)
        .encrypt();

      await contract
        .connect(signers.employee1)
        .submitResponse(
          encScore.handles[0],
          encScore.inputProof,
          deptId,
          encOne.handles[0],
          encOne.inputProof
        );

      // Grant permission to employee2
      await contract.allowUserToDecrypt(signers.employee2.address, [deptId]);

      // Employee2 should be able to decrypt
      const [deptTotal] = await contract.getDepartmentAggregates(deptId);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        deptTotal,
        contractAddress,
        signers.employee2
      );

      expect(decrypted).to.equal(score);
    });
  });
});

