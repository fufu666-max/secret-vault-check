# Employee Satisfaction Survey DApp

> An anonymous employee satisfaction survey platform powered by Fully Homomorphic Encryption (FHE) on Ethereum, ensuring complete privacy of individual responses while enabling transparent aggregate statistics.

## ✨ Features

- 🔐 **End-to-End Encryption**: Individual survey responses are encrypted using FHE
- 📊 **Encrypted Aggregation**: Smart contract computes totals and counts in encrypted state
- 🔓 **Selective Decryption**: Only aggregate statistics are decrypted for display
- 🏢 **Department-Based Analytics**: Track satisfaction across Marketing, Sales, Engineering, HR, and Finance

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.x
- npm >= 9.x

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set PRIVATE_KEY  # Optional, for Sepolia
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Run Tests
```bash
npm run test
```

### 5. Start Local Network
**Terminal A:**
```bash
npx hardhat node
```

**Terminal B:**
```bash
npm run deploy:local
```

## 📋 CLI Commands

### Submit Survey Response
```bash
npx hardhat --network localhost survey:submit --value 8 --dept 0
```

### View Global Aggregates
```bash
npx hardhat --network localhost survey:get-global
```

### View Department Aggregates
```bash
npx hardhat --network localhost survey:get-dept --dept 0
```

### Department IDs
- `0`: Marketing
- `1`: Sales
- `2`: Engineering
- `3`: HR
- `4`: Finance

## 🌐 Deploy to Sepolia
```bash
npm run deploy:sepolia
npx hardhat --network sepolia survey:submit --value 7 --dept 1
npx hardhat --network sepolia survey:get-global
```

## 📦 Smart Contract

### SatisfactionSurvey.sol

**Key Functions:**
- `submitResponse()`: Submit encrypted rating
- `getGlobalAggregates()`: Get encrypted global totals
- `getDepartmentAggregates()`: Get encrypted department totals
- `allowUserToDecrypt()`: Grant decryption permission

## 🔐 Privacy Guarantees

### Encrypted
- ✅ Individual employee ratings
- ✅ Individual department selections
- ✅ All computation states

### Decrypted
- ✅ Global aggregate statistics
- ✅ Per-department aggregates
- ✅ Computed averages

### Never Revealed
- ❌ Individual ratings
- ❌ Employee identities
- ❌ Submission linkage

## 📄 License

BSD-3-Clause-Clear
