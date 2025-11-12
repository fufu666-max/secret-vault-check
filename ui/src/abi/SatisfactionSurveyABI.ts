export const SatisfactionSurveyABI = {
  "abi": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "manager",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "uint256[]",
          "name": "deptIds",
          "type": "uint256[]"
        }
      ],
      "name": "allowUserToDecrypt",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decryptManager",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "deptId",
          "type": "uint256"
        }
      ],
      "name": "getDepartmentAggregates",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "total",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "count",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getGlobalAggregates",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "total",
          "type": "bytes32"
        },
        {
          "internalType": "euint32",
          "name": "count",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "encScore",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "scoreProof",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "deptId",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint32",
          "name": "encOne",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "oneProof",
          "type": "bytes"
        }
      ],
      "name": "submitResponse",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;