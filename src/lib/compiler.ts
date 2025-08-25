/* eslint-disable @typescript-eslint/no-explicit-any */
import * as solc from 'solc';
import { findImports } from './openzeppelin-imports';

export interface CompilerConfig {
  contractName: string;
  sourceCode: string;
  solcVersion?: string;
  optimizer?: {
    enabled: boolean;
    runs: number;
  };
  outputSelection?: any;
}

export interface CompilerResult {
  success: boolean;
  bytecode?: string;
  abi?: any[];
  artifacts?: any;
  warnings?: string[];
  errors?: string[];
  error?: string;
  gasEstimate?: number;
  compilationTarget?: string;
}

class SolidityCompiler {
  private solcInstance: any = null;
  private loadingPromise: Promise<any> | null = null;

  private async loadSolc(): Promise<any> {
    if (this.solcInstance) {
      return this.solcInstance;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise(async (resolve, reject) => {
      try {
        // Use the latest stable version or specific version
        const solcVersion = 'v0.8.20+commit.a1b79de6';
        
        // Load solc wrapper
        const solcWrapper = await import('solc');
        
        // Load the specific version
        const solcSnapshot = await new Promise<any>((resolveSnapshot, rejectSnapshot) => {
          solcWrapper.loadRemoteVersion(solcVersion, (err: any, solcInstance: any) => {
            if (err) {
              console.warn('Failed to load remote solc version, using built-in version:', err);
              // Fallback to built-in version
              resolveSnapshot(solcWrapper);
            } else {
              resolveSnapshot(solcInstance);
            }
          });
        });

        this.solcInstance = solcSnapshot;
        resolve(solcSnapshot);
      } catch (error) {
        console.error('Failed to load solc:', error);
        reject(error);
      }
    });

    return this.loadingPromise;
  }

  private createStandardInput(config: CompilerConfig): any {
    const { contractName, sourceCode, optimizer = { enabled: true, runs: 200 } } = config;

    return {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: sourceCode,
        },
      },
      settings: {
        optimizer,
        outputSelection: {
          '*': {
            '*': [
              'abi',
              'evm.bytecode',
              'evm.deployedBytecode',
              'evm.methodIdentifiers',
              'evm.gasEstimates',
              'devdoc',
              'userdoc',
            ],
          },
        },
        evmVersion: 'shanghai',
        remappings: [],
      },
    };
  }

  async compile(config: CompilerConfig): Promise<CompilerResult> {
    try {
      // Load solc if not already loaded
      const solcInstance = await this.loadSolc();
      
      // Create standard JSON input
      const input = this.createStandardInput(config);
      const inputStr = JSON.stringify(input);

      console.log('Starting Solidity compilation...');
      console.log('Contract:', config.contractName);

      // Compile the contract
      const output = JSON.parse(
        solcInstance.compile(inputStr, { import: findImports })
      );

      // Check for errors
      const errors = output.errors || [];
      const fatalErrors = errors.filter((error: any) => error.severity === 'error');
      const warnings = errors.filter((error: any) => error.severity === 'warning');

      console.log('Compilation completed');
      console.log('Errors:', fatalErrors.length);
      console.log('Warnings:', warnings.length);

      if (fatalErrors.length > 0) {
        console.error('Fatal compilation errors:', fatalErrors);
        return {
          success: false,
          errors: fatalErrors.map((error: any) => error.formattedMessage || error.message),
          warnings: warnings.map((warning: any) => warning.formattedMessage || warning.message),
          error: fatalErrors[0].formattedMessage || fatalErrors[0].message,
        };
      }

      // Extract compilation results
      const contractPath = `${config.contractName}.sol`;
      const contractOutput = output.contracts[contractPath];
      
      if (!contractOutput) {
        return {
          success: false,
          error: `Contract ${config.contractName} not found in compilation output`,
        };
      }

      // Find the main contract (usually the last one defined or matches the filename)
      const contractNames = Object.keys(contractOutput);
      const mainContractName = contractNames.find(name => 
        name === config.contractName
      ) || contractNames[contractNames.length - 1];

      const mainContract = contractOutput[mainContractName];

      if (!mainContract) {
        return {
          success: false,
          error: 'No contract found in compilation output',
        };
      }

      // Extract bytecode and ABI
      const bytecode = mainContract.evm?.bytecode?.object;
      const abi = mainContract.abi;
      const gasEstimates = mainContract.evm?.gasEstimates;

      console.log('Compilation results:');
      console.log('- Bytecode length:', bytecode ? bytecode.length : 0);
      console.log('- ABI functions:', abi ? abi.length : 0);

      // Calculate gas estimate for deployment
      let gasEstimate = 0;
      if (gasEstimates?.creation?.codeDepositCost && gasEstimates?.creation?.executionCost) {
        gasEstimate = parseInt(gasEstimates.creation.codeDepositCost) + 
                     parseInt(gasEstimates.creation.executionCost);
      } else if (bytecode) {
        // Rough estimate: 200 gas per byte of bytecode + 21000 base
        gasEstimate = Math.ceil(bytecode.length / 2) * 200 + 21000;
      }

      // Create artifacts structure similar to Hardhat
      const artifacts = {
        contractName: mainContractName,
        sourceName: contractPath,
        abi,
        bytecode: bytecode ? `0x${bytecode}` : undefined,
        deployedBytecode: mainContract.evm?.deployedBytecode?.object ? 
          `0x${mainContract.evm.deployedBytecode.object}` : undefined,
        linkReferences: mainContract.evm?.bytecode?.linkReferences || {},
        deployedLinkReferences: mainContract.evm?.deployedBytecode?.linkReferences || {},
        devdoc: mainContract.devdoc || {},
        userdoc: mainContract.userdoc || {},
        storageLayout: mainContract.storageLayout,
        methodIdentifiers: mainContract.evm?.methodIdentifiers || {},
        gasEstimates: gasEstimates || {},
      };

      return {
        success: true,
        bytecode: bytecode ? `0x${bytecode}` : undefined,
        abi,
        artifacts,
        warnings: warnings.map((warning: any) => warning.formattedMessage || warning.message),
        gasEstimate,
        compilationTarget: `${contractPath}:${mainContractName}`,
      };

    } catch (error) {
      console.error('Compilation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compilation error',
      };
    }
  }

  // Method to get available solc versions
  async getAvailableVersions(): Promise<string[]> {
    try {
      const solcWrapper = await import('solc');
      
      return new Promise((resolve) => {
        solcWrapper.loadRemoteVersion('list', (err: any, versionList: any) => {
          if (err) {
            console.warn('Could not load version list:', err);
            resolve(['0.8.20', '0.8.19', '0.8.18', '0.8.17']);
          } else {
            // Extract version numbers
            const versions = Object.keys(versionList.releases).sort((a, b) => {
              return versionList.releases[b].localeCompare(versionList.releases[a]);
            }).slice(0, 10); // Get latest 10 versions
            resolve(versions);
          }
        });
      });
    } catch (error) {
      console.error('Failed to get solc versions:', error);
      return ['0.8.20', '0.8.19', '0.8.18', '0.8.17'];
    }
  }

  // Method to preload solc for better performance
  async preloadSolc(): Promise<void> {
    try {
      await this.loadSolc();
      console.log('Solc preloaded successfully');
    } catch (error) {
      console.error('Failed to preload solc:', error);
    }
  }

  // Method to validate contract before compilation
  validateContract(config: CompilerConfig): { isValid: boolean; errors: string[] } {
    const { sourceCode } = config;
    const errors: string[] = [];

    // Basic syntax validation
    if (!sourceCode.includes('pragma solidity')) {
      errors.push('Missing pragma solidity directive');
    }

    if (!sourceCode.includes('contract ')) {
      errors.push('No contract definition found');
    }

    // Check for balanced braces
    const openBraces = (sourceCode.match(/\{/g) || []).length;
    const closeBraces = (sourceCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Unbalanced braces');
    }

    // Check for balanced parentheses
    const openParens = (sourceCode.match(/\(/g) || []).length;
    const closeParens = (sourceCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Unbalanced parentheses');
    }

    // Check for common Solidity patterns
    if (!sourceCode.match(/contract\s+\w+/)) {
      errors.push('Invalid contract declaration');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const solidityCompiler = new SolidityCompiler();

// Main function to compile contracts
export async function compileContract(config: CompilerConfig): Promise<CompilerResult> {
  // Validate contract before compilation
  const validation = solidityCompiler.validateContract(config);
  if (!validation.isValid) {
    return {
      success: false,
      error: `Validation failed: ${validation.errors.join(', ')}`,
      errors: validation.errors,
    };
  }

  return solidityCompiler.compile(config);
}

// Utility function to extract contract name from source code
export function extractContractName(sourceCode: string): string | null {
  const match = sourceCode.match(/contract\s+([A-Za-z_][A-Za-z0-9_]*)/);
  return match ? match[1] : null;
}

// Utility function to check if solc is ready
export function isSolcReady(): boolean {
  return solidityCompiler['solcInstance'] !== null;
}

// Initialize compiler (call this on app startup)
export function initializeCompiler(): Promise<void> {
  return solidityCompiler.preloadSolc();
}