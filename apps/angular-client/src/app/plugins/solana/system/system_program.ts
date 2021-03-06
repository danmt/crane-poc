export type SystemProgram = {
  "version": "0.1.0",
  "name": "system_program",
  "instructions": [
    {
      "name": "createAccount",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "space",
          "type": "u64"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "assign",
      "accounts": [
        {
          "name": "pubkey",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "transfer",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createAccountWithSeed",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "base",
          "type": "publicKey"
        },
        {
          "name": "seed",
          "type": "string"
        },
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "space",
          "type": "u64"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "advanceNonceAccount",
      "accounts": [
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdrawNonceAccount",
      "accounts": [
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "arg",
          "type": "u64"
        }
      ]
    },
    {
      "name": "authorizeNonceAccount",
      "accounts": [
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorized",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "arg",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "allocate",
      "accounts": [
        {
          "name": "pubkey",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "space",
          "type": "u64"
        }
      ]
    },
    {
      "name": "allocateWithSeed",
      "accounts": [
        {
          "name": "address",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "base",
          "type": "publicKey"
        },
        {
          "name": "seed",
          "type": "string"
        },
        {
          "name": "space",
          "type": "u64"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "assignWithSeed",
      "accounts": [
        {
          "name": "address",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "base",
          "type": "publicKey"
        },
        {
          "name": "seed",
          "type": "string"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "transferWithSeed",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fromBase",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "fromSeed",
          "type": "string"
        },
        {
          "name": "fromOwner",
          "type": "publicKey"
        }
      ]
    }
  ]
};

export const IDL: SystemProgram = {
  "version": "0.1.0",
  "name": "system_program",
  "instructions": [
    {
      "name": "createAccount",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "space",
          "type": "u64"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "assign",
      "accounts": [
        {
          "name": "pubkey",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "transfer",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createAccountWithSeed",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "base",
          "type": "publicKey"
        },
        {
          "name": "seed",
          "type": "string"
        },
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "space",
          "type": "u64"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "advanceNonceAccount",
      "accounts": [
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdrawNonceAccount",
      "accounts": [
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "arg",
          "type": "u64"
        }
      ]
    },
    {
      "name": "authorizeNonceAccount",
      "accounts": [
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorized",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "arg",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "allocate",
      "accounts": [
        {
          "name": "pubkey",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "space",
          "type": "u64"
        }
      ]
    },
    {
      "name": "allocateWithSeed",
      "accounts": [
        {
          "name": "address",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "base",
          "type": "publicKey"
        },
        {
          "name": "seed",
          "type": "string"
        },
        {
          "name": "space",
          "type": "u64"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "assignWithSeed",
      "accounts": [
        {
          "name": "address",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "base",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "base",
          "type": "publicKey"
        },
        {
          "name": "seed",
          "type": "string"
        },
        {
          "name": "owner",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "transferWithSeed",
      "accounts": [
        {
          "name": "from",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fromBase",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "to",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lamports",
          "type": "u64"
        },
        {
          "name": "fromSeed",
          "type": "string"
        },
        {
          "name": "fromOwner",
          "type": "publicKey"
        }
      ]
    }
  ]
};
