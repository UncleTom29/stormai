/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ContractTemplate {
  name: string;
  description: string;
  template: string;
  features: string[];
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
  }[];
}

export const contractTemplates: Record<string, ContractTemplate> = {
  erc20: {
    name: "ERC-20 Token",
    description: "Standard fungible token contract",
    template: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
{{IMPORTS}}

/**
 * @title {{CONTRACT_NAME}}
 * @dev ERC20 token with additional features
 */
contract {{CONTRACT_NAME}} is ERC20, Ownable{{INHERITANCE}} {
    {{STATE_VARIABLES}}

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {{CONSTRUCTOR_CALLS}} {
        {{CONSTRUCTOR_BODY}}
        _mint(owner, initialSupply * 10 ** decimals());
    }

    {{FUNCTIONS}}
}`,
    features: ['mintable', 'burnable', 'pausable', 'capped', 'permit'],
    parameters: [
      { name: 'name', type: 'string', description: 'Token name', required: true },
      { name: 'symbol', type: 'string', description: 'Token symbol', required: true },
      { name: 'initialSupply', type: 'uint256', description: 'Initial token supply', required: true, default: 1000000 },
      { name: 'owner', type: 'address', description: 'Contract owner address', required: true },
    ],
  },

  erc721: {
    name: "ERC-721 NFT",
    description: "Non-fungible token contract",
    template: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
{{IMPORTS}}

/**
 * @title {{CONTRACT_NAME}}
 * @dev ERC721 NFT contract with additional features
 */
contract {{CONTRACT_NAME}} is ERC721, Ownable{{INHERITANCE}} {
    uint256 private _nextTokenId;
    {{STATE_VARIABLES}}

    constructor(
        string memory name,
        string memory symbol,
        address owner
    ) ERC721(name, symbol) Ownable(owner) {{CONSTRUCTOR_CALLS}} {
        {{CONSTRUCTOR_BODY}}
    }

    function mint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }

    {{FUNCTIONS}}
}`,
    features: ['enumerable', 'uri_storage', 'burnable', 'pausable', 'royalty'],
    parameters: [
      { name: 'name', type: 'string', description: 'NFT collection name', required: true },
      { name: 'symbol', type: 'string', description: 'NFT collection symbol', required: true },
      { name: 'owner', type: 'address', description: 'Contract owner address', required: true },
    ],
  },

  erc1155: {
    name: "ERC-1155 Multi-Token",
    description: "Multi-token standard contract",
    template: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
{{IMPORTS}}

/**
 * @title {{CONTRACT_NAME}}
 * @dev ERC1155 multi-token contract with additional features
 */
contract {{CONTRACT_NAME}} is ERC1155, Ownable{{INHERITANCE}} {
    {{STATE_VARIABLES}}

    constructor(
        string memory uri,
        address owner
    ) ERC1155(uri) Ownable(owner) {{CONSTRUCTOR_CALLS}} {
        {{CONSTRUCTOR_BODY}}
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    {{FUNCTIONS}}
}`,
    features: ['burnable', 'pausable', 'supply'],
    parameters: [
      { name: 'uri', type: 'string', description: 'Metadata URI template', required: true },
      { name: 'owner', type: 'address', description: 'Contract owner address', required: true },
    ],
  },

  governance: {
    name: "Governance Token",
    description: "DAO governance token with voting capabilities",
    template: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title {{CONTRACT_NAME}}
 * @dev Governance token with voting capabilities
 */
contract {{CONTRACT_NAME}} is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(owner) {
        _mint(owner, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity.
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}`,
    features: [],
    parameters: [
      { name: 'name', type: 'string', description: 'Token name', required: true },
      { name: 'symbol', type: 'string', description: 'Token symbol', required: true },
      { name: 'initialSupply', type: 'uint256', description: 'Initial token supply', required: true, default: 1000000 },
      { name: 'owner', type: 'address', description: 'Contract owner address', required: true },
    ],
  },
};

export const featureImplementations: Record<string, {
  imports: string[];
  inheritance: string[];
  stateVariables: string[];
  constructorCalls: string[];
  constructorBody: string[];
  functions: string[];
}> = {
  mintable: {
    imports: [],
    inheritance: [],
    stateVariables: [],
    constructorCalls: [],
    constructorBody: [],
    functions: [
      `function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }`
    ],
  },

  burnable: {
    imports: ['import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";'],
    inheritance: ['ERC20Burnable'],
    stateVariables: [],
    constructorCalls: [],
    constructorBody: [],
    functions: [],
  },

  pausable: {
    imports: ['import "@openzeppelin/contracts/security/Pausable.sol";'],
    inheritance: ['Pausable'],
    stateVariables: [],
    constructorCalls: [],
    constructorBody: [],
    functions: [
      `function pause() public onlyOwner {
        _pause();
    }`,
      `function unpause() public onlyOwner {
        _unpause();
    }`,
      `function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal whenNotPaused override {
        super._beforeTokenTransfer(from, to, amount);
    }`
    ],
  },

  capped: {
    imports: ['import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";'],
    inheritance: ['ERC20Capped'],
    stateVariables: [],
    constructorCalls: ['ERC20Capped(cap)'],
    constructorBody: [],
    functions: [],
  },

  permit: {
    imports: ['import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";'],
    inheritance: ['ERC20Permit'],
    stateVariables: [],
    constructorCalls: ['ERC20Permit(name)'],
    constructorBody: [],
    functions: [],
  },

  enumerable: {
    imports: ['import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";'],
    inheritance: ['ERC721Enumerable'],
    stateVariables: [],
    constructorCalls: [],
    constructorBody: [],
    functions: [
      `function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }`,
      `function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }`
    ],
  },

  uri_storage: {
    imports: ['import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";'],
    inheritance: ['ERC721URIStorage'],
    stateVariables: [],
    constructorCalls: [],
    constructorBody: [],
    functions: [
      `function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }`,
      `function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }`
    ],
  },

  royalty: {
    imports: ['import "@openzeppelin/contracts/token/common/ERC2981.sol";'],
    inheritance: ['ERC2981'],
    stateVariables: [],
    constructorCalls: [],
    constructorBody: [
      '_setDefaultRoyalty(owner, 250); // 2.5% royalty'
    ],
    functions: [
      `function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }`,
      `function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }`
    ],
  },
};

export function generateContract(
  type: keyof typeof contractTemplates,
  contractName: string,
  features: string[],
  parameters: Record<string, any>
): string {
  const template = contractTemplates[type];
  if (!template) {
    throw new Error(`Unknown contract type: ${type}`);
  }

  let code = template.template;
  
  // Collect all feature implementations
  const imports = new Set<string>();
  const inheritance = new Set<string>();
  const stateVariables: string[] = [];
  const constructorCalls: string[] = [];
  const constructorBody: string[] = [];
  const functions: string[] = [];

  features.forEach(feature => {
    const impl = featureImplementations[feature];
    if (impl) {
      impl.imports.forEach(imp => imports.add(imp));
      impl.inheritance.forEach(inh => inheritance.add(inh));
      stateVariables.push(...impl.stateVariables);
      constructorCalls.push(...impl.constructorCalls);
      constructorBody.push(...impl.constructorBody);
      functions.push(...impl.functions);
    }
  });

  // Replace placeholders
  code = code.replace('{{CONTRACT_NAME}}', contractName);
  code = code.replace('{{IMPORTS}}', Array.from(imports).join('\n'));
  code = code.replace('{{INHERITANCE}}', inheritance.size > 0 ? ', ' + Array.from(inheritance).join(', ') : '');
  code = code.replace('{{STATE_VARIABLES}}', stateVariables.join('\n    '));
  code = code.replace('{{CONSTRUCTOR_CALLS}}', constructorCalls.length > 0 ? ' ' + constructorCalls.join(' ') : '');
  code = code.replace('{{CONSTRUCTOR_BODY}}', constructorBody.join('\n        '));
  code = code.replace('{{FUNCTIONS}}', functions.join('\n\n    '));

  return code;
}