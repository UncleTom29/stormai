/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { BrowserProvider, Contract, ContractFactory, parseUnits, formatEther } from 'ethers';
import { X, Zap, Settings, AlertTriangle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractData: {
    name: string;
    symbol?: string;
    type: string;
    bytecode: string;
    abi: any[];
    constructorArgs: Record<string, any>;
  };
  onSuccess: (result: { contractAddress: string; transactionHash: string }) => void;
  onError: (error: string) => void;
}

interface DeploymentParams {
  network: 'sei-testnet' | 'sei-mainnet';
  gasPrice: string;
  gasLimit: string;
  constructorArgs: Record<string, string>;
}

export function DeployModal({ isOpen, onClose, contractData, onSuccess, onError }: DeployModalProps) {
  const { address, isConnected } = useAccount();
  
  const [deployParams, setDeployParams] = useState<DeploymentParams>({
    network: 'sei-testnet',
    gasPrice: '20',
    gasLimit: '3000000',
    constructorArgs: {},
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [deploymentStep, setDeploymentStep] = useState<
    'configure' | 'estimating' | 'deploying' | 'confirming' | 'success' | 'error'
  >('configure');
  const [deploymentHash, setDeploymentHash] = useState<string>('');
  const [deploymentError, setDeploymentError] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');

  // Initialize constructor arguments
  useEffect(() => {
    if (contractData.constructorArgs && isOpen) {
      const args: Record<string, string> = {};
      Object.entries(contractData.constructorArgs).forEach(([key, value]) => {
        args[key] = String(value);
      });
      setDeployParams(prev => ({ ...prev, constructorArgs: args }));
    }
  }, [contractData.constructorArgs, isOpen]);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setDeploymentStep('configure');
      setIsDeploying(false);
      setEstimatedGas(null);
      setDeploymentHash('');
      setDeploymentError('');
      setContractAddress('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getProvider = async (): Promise<BrowserProvider> => {
    if (!window.ethereum) {
      throw new Error('No ethereum provider found');
    }
    return new BrowserProvider(window.ethereum);
  };

  const handleParamChange = (key: keyof DeploymentParams, value: string) => {
    setDeployParams(prev => ({ ...prev, [key]: value }));
  };

  const handleArgChange = (arg: string, value: string) => {
    setDeployParams(prev => ({
      ...prev,
      constructorArgs: {
        ...prev.constructorArgs,
        [arg]: value,
      },
    }));
  };

  const estimateGas = async () => {
    if (!contractData.bytecode || !contractData.abi) return;

    setDeploymentStep('estimating');
    
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      // Prepare constructor arguments
      const constructorArgs = Object.values(deployParams.constructorArgs);
      
      // Create contract factory
      const contractFactory = new ContractFactory(
        contractData.abi,
        contractData.bytecode,
        signer
      );

      // Estimate deployment gas
      const deployTransaction = await contractFactory.getDeployTransaction(...constructorArgs);
      const gasEstimate = await provider.estimateGas(deployTransaction);

      setEstimatedGas(gasEstimate);
      setDeploymentStep('configure');
      toast.success('Gas estimation complete');
    } catch (error) {
      console.error('Gas estimation failed:', error);
      setDeploymentStep('configure');
      const errorMessage = error instanceof Error ? error.message : 'Gas estimation failed';
      toast.error(errorMessage);
    }
  };

  const deployContract = async () => {
    if (!isConnected || !contractData.bytecode || !contractData.abi) {
      toast.error('Wallet not connected or contract data missing');
      return;
    }

    setIsDeploying(true);
    setDeploymentStep('deploying');

    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      
      // Prepare constructor arguments
      const constructorArgs = Object.values(deployParams.constructorArgs);
      
      console.log('Deploying contract with args:', constructorArgs);
      console.log('Gas limit:', deployParams.gasLimit);
      console.log('Gas price:', deployParams.gasPrice, 'Gwei');

      // Create contract factory
      const contractFactory = new ContractFactory(
        contractData.abi,
        contractData.bytecode,
        signer
      );

      // Deploy the contract
      const contract = await contractFactory.deploy(...constructorArgs, {
        gasLimit: deployParams.gasLimit,
        gasPrice: parseUnits(deployParams.gasPrice, 'gwei'),
      });

      const deploymentTx = contract.deploymentTransaction();
      if (!deploymentTx) {
        throw new Error('No deployment transaction found');
      }

      setDeploymentHash(deploymentTx.hash);
      setDeploymentStep('confirming');
      
      console.log('Deployment transaction sent:', deploymentTx.hash);
      console.log('Waiting for confirmation...');

      // Wait for deployment to be mined
      await contract.waitForDeployment();
      
      const deployedAddress = await contract.getAddress();
      const receipt = await deploymentTx.wait();
      
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      if (receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      setContractAddress(deployedAddress);
      setDeploymentStep('success');
      
      console.log('Contract deployed successfully!');
      console.log('Contract address:', deployedAddress);
      console.log('Transaction hash:', deploymentTx.hash);
      console.log('Gas used:', receipt.gasUsed.toString());
      console.log('Block number:', receipt.blockNumber);

      // Save deployment to database
      try {
        const response = await fetch('/api/contracts/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: address,
            contractId: `${Date.now()}`, // This should be the actual contract ID
            contractAddress: deployedAddress,
            transactionHash: deploymentTx.hash,
            network: deployParams.network,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: receipt.gasPrice?.toString() || deployParams.gasPrice,
          }),
        });

        if (!response.ok) {
          console.warn('Failed to save deployment to database');
        }
      } catch (dbError) {
        console.warn('Database save failed:', dbError);
      }

      onSuccess({
        contractAddress: deployedAddress,
        transactionHash: deploymentTx.hash,
      });

      toast.success('Contract deployed successfully!');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStep('error');
      
      let errorMessage = 'Deployment failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle common errors
        if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for deployment';
        } else if (error.message.includes('gas required exceeds allowance')) {
          errorMessage = 'Gas limit too low, try increasing it';
        } else if (error.message.includes('nonce too high')) {
          errorMessage = 'Transaction nonce issue, please try again';
        } else if (error.message.includes('replacement transaction underpriced')) {
          errorMessage = 'Gas price too low, try increasing it';
        }
      }
      
      setDeploymentError(errorMessage);
      onError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeploying(false);
    }
  };

  const resetModal = () => {
    setDeploymentStep('configure');
    setIsDeploying(false);
    setEstimatedGas(null);
    setDeploymentHash('');
    setDeploymentError('');
    setContractAddress('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const explorerUrl = deployParams.network === 'sei-mainnet' 
    ? 'https://seitrace.com' 
    : 'https://testnet.seitrace.com';

  const calculateEstimatedCost = (): string => {
    if (!estimatedGas) return '0';
    const costWei = estimatedGas * parseUnits(deployParams.gasPrice, 'gwei');
    return formatEther(costWei);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Deploy Contract</h2>
            <p className="text-sm text-slate-400">Deploy {contractData.name} to the blockchain</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {deploymentStep === 'configure' && (
            <>
              {/* Network Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Network</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'sei-testnet', label: 'Sei Testnet', desc: 'For testing', color: '#16a34a' },
                    { value: 'sei-mainnet', label: 'Sei Mainnet', desc: 'Production', color: '#dc2626' },
                  ].map((network) => (
                    <div
                      key={network.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        deployParams.network === network.value
                          ? 'border-blue-400 bg-blue-600 bg-opacity-20'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                      onClick={() => handleParamChange('network', network.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-100 text-sm">{network.label}</div>
                          <div className="text-xs text-slate-400">{network.desc}</div>
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: network.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gas Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gas Price (Gwei)
                  </label>
                  <input
                    type="number"
                    value={deployParams.gasPrice}
                    onChange={(e) => handleParamChange('gasPrice', e.target.value)}
                    className="form-control"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gas Limit
                  </label>
                  <input
                    type="number"
                    value={deployParams.gasLimit}
                    onChange={(e) => handleParamChange('gasLimit', e.target.value)}
                    className="form-control"
                    min="21000"
                    step="1000"
                  />
                </div>
              </div>

              {/* Gas Estimation */}
              {estimatedGas && (
                <div className="p-3 bg-blue-600 bg-opacity-20 border border-blue-600 border-opacity-30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Estimated Gas:</span>
                    <span className="text-sm font-medium text-blue-400">
                      {estimatedGas.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-slate-300">Estimated Cost:</span>
                    <span className="text-sm font-medium text-blue-400">
                      {calculateEstimatedCost()} SEI
                    </span>
                  </div>
                </div>
              )}

              {/* Constructor Arguments */}
              {Object.keys(deployParams.constructorArgs).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Constructor Arguments
                  </label>
                  <div className="space-y-3">
                    {Object.entries(deployParams.constructorArgs).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-slate-400 mb-1 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleArgChange(key, e.target.value)}
                          className="form-control text-sm"
                          placeholder={`Enter ${key}...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contract Info */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Contract Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="text-slate-200">{contractData.name}</span>
                  </div>
                  {contractData.symbol && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Symbol:</span>
                      <span className="text-slate-200">{contractData.symbol}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-slate-200 uppercase">{contractData.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bytecode:</span>
                    <span className="text-slate-200">{contractData.bytecode.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ABI Functions:</span>
                    <span className="text-slate-200">{contractData.abi.filter(item => item.type === 'function').length}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={estimateGas}
                  disabled={!contractData.bytecode}
                  className="btn btn-secondary flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Estimate Gas
                </button>
                <button
                  onClick={deployContract}
                  disabled={!isConnected || !contractData.bytecode}
                  className="btn btn-warning flex-1"
                  style={{
                    background: (!isConnected || !contractData.bytecode) ? '#475569' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Deploy Contract
                </button>
              </div>
            </>
          )}

          {deploymentStep === 'estimating' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">Estimating Gas</h3>
              <p className="text-slate-400">Calculating deployment costs...</p>
            </div>
          )}

          {deploymentStep === 'deploying' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">Deploying Contract</h3>
              <p className="text-slate-400">Please confirm the transaction in your wallet...</p>
            </div>
          )}

          {deploymentStep === 'confirming' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">Confirming Transaction</h3>
              <p className="text-slate-400 mb-4">Waiting for blockchain confirmation...</p>
              
              {deploymentHash && (
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Transaction Hash:</div>
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-slate-200 break-all">
                      {deploymentHash}
                    </code>
                    <a
                      href={`${explorerUrl}/tx/${deploymentHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {deploymentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">Deployment Successful!</h3>
              <p className="text-slate-400 mb-6">Your contract has been deployed to the blockchain</p>
              
              <div className="bg-green-600 bg-opacity-20 border border-green-600 border-opacity-30 rounded-lg p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-300">Contract Address:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-green-200 text-xs">{contractAddress}</code>
                      <a
                        href={`${explorerUrl}/address/${contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-300">Transaction:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-green-200 text-xs">{deploymentHash.slice(0, 10)}...{deploymentHash.slice(-8)}</code>
                      <a
                        href={`${explorerUrl}/tx/${deploymentHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                }}
              >
                Continue
              </button>
            </div>
          )}

          {deploymentStep === 'error' && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-100 mb-2">Deployment Failed</h3>
              <p className="text-slate-400 mb-4">There was an error deploying your contract</p>
              
              <div className="bg-red-600 bg-opacity-20 border border-red-600 border-opacity-30 rounded-lg p-4 mb-6">
                <div className="text-sm text-red-400 text-left">
                  {deploymentError || 'Unknown deployment error'}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setDeploymentStep('configure')}
                  className="btn btn-secondary flex-1"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="btn btn-primary flex-1"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
