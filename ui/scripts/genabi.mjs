import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const deploymentsPath = join(process.cwd(), '..', 'deployments');
const abiOutputPath = join(process.cwd(), 'src', 'abi');

if (!existsSync(abiOutputPath)) {
  mkdirSync(abiOutputPath, { recursive: true });
}

const abiFileContent = {
  abi: []
};
const addressesFileContent = {};
const mockFhevmAddressesContent = {};

try {
  if (existsSync(deploymentsPath)) {
    const chainDirs = readdirSync(deploymentsPath);
    for (const chainDirName of chainDirs) {
      // Map directory name to actual chainId
      const chainId = chainDirName === 'localhost' ? '31337' : chainDirName;
      const chainDeploymentPath = join(deploymentsPath, chainDirName);
      if (statSync(chainDeploymentPath).isDirectory()) {
        const files = readdirSync(chainDeploymentPath);
        
        // Store mock FHEVM contract addresses
        const mockAddresses = {};
        
        for (const file of files) {
          if (file.endsWith('.json') && !file.includes('.dbg.')) {
            const filePath = join(chainDeploymentPath, file);
            const deployment = JSON.parse(readFileSync(filePath, 'utf8'));
            if (file === 'SatisfactionSurvey.json') {
              abiFileContent.abi = deployment.abi;
              addressesFileContent[chainId] = {
                address: deployment.address,
                chainId: parseInt(chainId),
                chainName: chainId === '31337' ? 'hardhat' : chainId === '11155111' ? 'sepolia' : 'unknown'
              };
            }
            // Collect Mock FHEVM contract addresses
            if (file === 'MockACL.json') {
              mockAddresses.ACLAddress = deployment.address;
            } else if (file === 'MockInputVerifier.json') {
              mockAddresses.InputVerifierAddress = deployment.address;
            } else if (file === 'MockKMSVerifier.json') {
              mockAddresses.KMSVerifierAddress = deployment.address;
            }
          }
        }
        
        // If mock FHEVM addresses found, add to config
        if (Object.keys(mockAddresses).length > 0) {
          mockFhevmAddressesContent[chainId] = mockAddresses;
        }
      }
    }
  }
} catch (error) {
  console.warn("No deployments found or error reading deployments:", error.message);
}

// Write ABI file
const abiContent = `export const SatisfactionSurveyABI = ${JSON.stringify(abiFileContent, null, 2)} as const;`;
writeFileSync(join(abiOutputPath, 'SatisfactionSurveyABI.ts'), abiContent);

// Write Addresses file
const addressesContent = `export const SatisfactionSurveyAddresses: Record<string, { address: \`0x\${string}\`, chainId: number, chainName: string }> = ${JSON.stringify(addressesFileContent, null, 2)};`;
writeFileSync(join(abiOutputPath, 'SatisfactionSurveyAddresses.ts'), addressesContent);

// Write Mock FHEVM Addresses file
const mockFhevmContent = `/**
 * Mock FHEVM contract address configuration
 * These addresses are automatically generated during hardhat deploy
 */
export const MockFhevmAddresses: Record<string, { 
  ACLAddress?: \`0x\${string}\`, 
  InputVerifierAddress?: \`0x\${string}\`, 
  KMSVerifierAddress?: \`0x\${string}\` 
}> = ${JSON.stringify(mockFhevmAddressesContent, null, 2)};

export function getMockFhevmAddresses(chainId: number) {
  return MockFhevmAddresses[chainId.toString()];
}
`;
writeFileSync(join(abiOutputPath, 'MockFhevmAddresses.ts'), mockFhevmContent);

console.log("✅ Generated ABI and Addresses for SatisfactionSurvey.");
console.log("✅ Generated Mock FHEVM Addresses.");
console.log("   Chains found:", Object.keys(addressesFileContent).join(', ') || 'none');
