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

try {
  if (existsSync(deploymentsPath)) {
    const chainDirs = readdirSync(deploymentsPath);
    for (const chainId of chainDirs) {
      const chainDeploymentPath = join(deploymentsPath, chainId);
      if (statSync(chainDeploymentPath).isDirectory()) {
        const files = readdirSync(chainDeploymentPath);
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
          }
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

console.log("✅ Generated ABI and Addresses for SatisfactionSurvey.");
console.log("   Chains found:", Object.keys(addressesFileContent).join(', ') || 'none');
