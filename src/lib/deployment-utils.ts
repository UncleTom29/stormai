/* eslint-disable @typescript-eslint/no-explicit-any */
import { createWalletClient, createPublicClient, custom, http, parseAbi } from 'viem';
import { seiMainnet, seiTestnet } from './wagmi';

export interface DeploymentConfig {
  contractName: string;
  bytecode: string;
  abi: any[];
  constructorArgs: any[];
  network: 'sei-mainnet' | 'sei-testnet';
  gasLimit?: bigint;
  gasPrice?: bigint;
}

export interface DeploymentResult {
  success: boolean;
  transactionHash?: string;
  contractAddress?: string;
  error?: string;
}

export class ContractDeployer {
  private getChain(network: 'sei-mainnet' | 'sei-testnet') {
    return network === 'sei-mainnet' ? seiMainnet : seiTestnet;
  }

  private getPublicClient(network: 'sei-mainnet' | 'sei-testnet') {
    const chain = this.getChain(network);
    return createPublicClient({
      chain,
      transport: http(),
    });
  }

  private async getWalletClient(network: 'sei-mainnet' | 'sei-testnet') {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Ethereum provider not available');
    }

    const chain = this.getChain(network);
    return createWalletClient({
      chain,
      transport: custom(window.ethereum),
    });
  }

  async estimateDeploymentGas(config: DeploymentConfig): Promise<bigint> {
    try {
      const publicClient = this.getPublicClient(config.network);
      
      // Estimate gas for contract deployment
      const gasEstimate = await publicClient.estimateGas({
        data: `${config.bytecode}${this.encodeConstructorArgs(config.abi, config.constructorArgs)}` as `0x${string}`,
      });

      return gasEstimate;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      // Return a reasonable default gas limit
      return BigInt(3000000);
    }
  }

  async deployContract(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      const walletClient = await this.getWalletClient(config.network);
      const publicClient = this.getPublicClient(config.network);

      // Get the connected account
      const [account] = await walletClient.getAddresses();
      if (!account) {
        return { success: false, error: 'No account connected' };
      }

      // Prepare deployment data
      const deploymentData = `${config.bytecode}${this.encodeConstructorArgs(config.abi, config.constructorArgs)}`;

      // Estimate gas if not provided
      const gasLimit = config.gasLimit || await this.estimateDeploymentGas(config);

      // Deploy the contract
      const hash = await walletClient.deployContract({
        abi: config.abi,
        bytecode: config.bytecode as `0x${string}`,
        args: config.constructorArgs,
        account,
        gas: gasLimit,
        gasPrice: config.gasPrice,
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'success' && receipt.contractAddress) {
        return {
          success: true,
          transactionHash: hash,
          contractAddress: receipt.contractAddress,
        };
      } else {
        return {
          success: false,
          error: 'Contract deployment failed - transaction reverted',
        };
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
      };
    }
  }

  async verifyDeployment(
    transactionHash: string,
    network: 'sei-mainnet' | 'sei-testnet'
  ): Promise<{
    isValid: boolean;
    contractAddress?: string;
    blockNumber?: bigint;
    gasUsed?: bigint;
    gasPrice?: bigint;
  }> {
    try {
      const publicClient = this.getPublicClient(network);
      
      const receipt = await publicClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      return {
        isValid: receipt.status === 'success',
        contractAddress: receipt.contractAddress || undefined,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        gasPrice: receipt.effectiveGasPrice,
      };
    } catch (error) {
      console.error('Verification failed:', error);
      return { isValid: false };
    }
  }

  private encodeConstructorArgs(abi: any[], args: any[]): string {
    if (!args || args.length === 0) return '';

    try {
      // Find constructor in ABI
      const constructor = abi.find(item => item.type === 'constructor');
      if (!constructor || !constructor.inputs || constructor.inputs.length === 0) {
        return '';
      }

      // This is a simplified implementation
      // In production, you'd want to use a proper ABI encoder
      return '';
    } catch (error) {
      console.error('Constructor encoding failed:', error);
      return '';
    }
  }

  async getContractDetails(
    contractAddress: string,
    network: 'sei-mainnet' | 'sei-testnet'
  ): Promise<{
    isContract: boolean;
    bytecode?: string;
    balance?: bigint;
  }> {
    try {
      const publicClient = this.getPublicClient(network);
      
      const bytecode = await publicClient.getBytecode({
        address: contractAddress as `0x${string}`,
      });

      const balance = await publicClient.getBalance({
        address: contractAddress as `0x${string}`,
      });

      return {
        isContract: Boolean(bytecode && bytecode !== '0x'),
        bytecode,
        balance,
      };
    } catch (error) {
      console.error('Failed to get contract details:', error);
      return { isContract: false };
    }
  }
}