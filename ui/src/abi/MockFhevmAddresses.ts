/**
 * Mock FHEVM contract address configuration
 * These addresses are automatically generated during hardhat deploy
 */
export const MockFhevmAddresses: Record<string, { 
  ACLAddress?: `0x${string}`, 
  InputVerifierAddress?: `0x${string}`, 
  KMSVerifierAddress?: `0x${string}` 
}> = {};

export function getMockFhevmAddresses(chainId: number) {
  return MockFhevmAddresses[chainId.toString()];
}
