import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get deployed contract address from latest deployment
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed address
  
  const SatisfactionSurvey = await ethers.getContractFactory("SatisfactionSurvey");
  const contract = SatisfactionSurvey.attach(contractAddress);
  
  console.log("Testing handle retrieval from contract...");
  console.log("Contract address:", contractAddress);
  console.log("Deployer address:", deployer.address);
  
  try {
    // Get global aggregates
    const globalAgg = await contract.getGlobalAggregates();
    console.log("\n=== Global Aggregates ===");
    console.log("Raw result:", globalAgg);
    console.log("Total (as string):", globalAgg[0].toString());
    console.log("Count (as string):", globalAgg[1].toString());
    console.log("Total type:", typeof globalAgg[0]);
    console.log("Count type:", typeof globalAgg[1]);
    
    // Try to convert to hex string
    try {
      const totalHex = ethers.toBeHex(globalAgg[0], 32);
      const countHex = ethers.toBeHex(globalAgg[1], 32);
      console.log("Total (hex):", totalHex);
      console.log("Count (hex):", countHex);
    } catch (error: any) {
      console.error("Conversion to hex failed:", error.message);
    }
    
    // Get department aggregates
    const deptAgg = await contract.getDepartmentAggregates(0);
    console.log("\n=== Department 0 Aggregates ===");
    console.log("Raw result:", deptAgg);
    console.log("Total (as string):", deptAgg[0].toString());
    console.log("Count (as string):", deptAgg[1].toString());
    
    // Try to convert to hex string
    try {
      const totalHex = ethers.toBeHex(deptAgg[0], 32);
      const countHex = ethers.toBeHex(deptAgg[1], 32);
      console.log("Total (hex):", totalHex);
      console.log("Count (hex):", countHex);
    } catch (error: any) {
      console.error("Conversion to hex failed:", error.message);
    }
    
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

