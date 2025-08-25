'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseEther, parseUnits, parseAbi } from 'viem';
import { seiTestnet, seiMainnet } from '@/lib/wagmi';
import { ContractDeployer } from '@/lib/deployment-utils';
import { Terminal } from './Terminal';
import { Zap, Settings, Play, AlertTriangle, ExternalLink, Shield, CheckCircle, Clock, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeploymentParams {
  network: 'sei-testnet' | 'sei-mainnet';
  gasPrice: string;
  gasLimit: string;
  constructorArgs: Record<string, string>;
}

export function DeployPanel() {
  const { currentContract, addDeployment, updateContract } = useAppStore();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [deployParams, setDeployParams] = useState<DeploymentParams>({
    network: 'sei-testnet',
    gasPrice: '20',
    gasLimit: '3000000',
    constructorArgs: {},
  });
  
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([
    '🚀 StormAI Deployment Console',
    '💡 Connect your wallet and configure deployment parameters',
    '',
  ]);

  const [isDeploying, setIsDeploying] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<{
    success: boolean;
    transactionHash?: string;
    contractAddress?: string;
    error?: string;
  } | null>(null);

  const deployer = new ContractDeployer();

  useEffect(() => {
    if (currentContract && address) {
      // Initialize constructor arguments based on contract type
      const defaultArgs: Record<string, string> = {};
      
      if (currentContract.type === 'erc20' || currentContract.type === 'governance') {
        defaultArgs.name = currentContract.name;
        defaultArgs.symbol = currentContract.symbol || '';
        defaultArgs.initialSupply = currentContract.parameters?.initialSupply || '1000000';
        defaultArgs.owner = address;
      } else if (currentContract.type === 'erc721') {
        defaultArgs.name = currentContract.name;
        defaultArgs.symbol = currentContract.symbol || '';
        defaultArgs.owner = address;
      } else if (currentContract.type === 'erc1155') {
        defaultArgs.uri = 'https://api.example.com/metadata/{id}.json';
        defaultArgs.owner = address;
      }

      setDeployParams(prev => ({
        ...prev,
        constructorArgs: defaultArgs,
      }));
    }
  }, [currentContract, address]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDeploymentLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const estimateGas = async () => {
    if (!currentContract || !currentContract.bytecode || !isConnected) {
      toast.error('Contract bytecode and wallet connection required');
      return;
    }

    try {
      addLog('⚡ Estimating gas costs...');

      const gasEstimate = await deployer.estimateDeploymentGas({
        contractName: currentContract.name,
        bytecode: currentContract.bytecode,
        abi: currentContract.abi || [],
        constructorArgs: Object.values(deployParams.constructorArgs),
        network: deployParams.network,
      });

      setEstimatedGas(gasEstimate);
      addLog(`📊 Estimated gas: ${gasEstimate.toLocaleString()}`);
      
      const gasCostWei = gasEstimate * parseUnits(deployParams.gasPrice, 9);
      const gasCostSei = Number(gasCostWei) / 1e18;
      addLog(`💰 Estimated cost: ${gasCostSei.toFixed(6)} SEI`);
      
      toast.success('Gas estimation complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gas estimation failed';
      addLog(`❌ Gas estimation failed: ${errorMessage}`);
      toast.error('Gas estimation failed');
    }
  };

  const deployContract = async () => {
    if (!currentContract || !currentContract.bytecode || !currentContract.abi || !isConnected || !address) {
      toast.error('Contract bytecode, ABI, and wallet connection required');
      return;
    }

    setIsDeploying(true);
    addLog('🚀 Starting contract deployment...');

    try {
      addLog(`🌐 Deploying to ${deployParams.network}...`);
      addLog('📝 Preparing deployment transaction...');

      const result = await deployer.deployContract({
        contractName: currentContract.name,
        bytecode: currentContract.bytecode,
        abi: currentContract.abi,
        constructorArgs: Object.values(deployParams.constructorArgs),
        network: deployParams.network,
        gasLimit: BigInt(deployParams.gasLimit),
        gasPrice: parseUnits(deployParams.gasPrice, 9),
      });

      if (result.success && result.transactionHash && result.contractAddress) {
        addLog(`📋 Transaction submitted: ${result.transactionHash}`);
        addLog('⏳ Waiting for confirmation...');

        // Verify the deployment
        const verification = await deployer.verifyDeployment(
          result.transactionHash,
          deployParams.network
        );

        if (verification.isValid) {
          addLog('✅ Deployment confirmed!');
          addLog(`📍 Contract deployed at: ${result.contractAddress}`);
          addLog(`🧱 Block number: ${verification.blockNumber?.toString()}`);
          addLog(`⛽ Gas used: ${verification.gasUsed?.toString()}`);

          // Record deployment in database
          try {
            const response = await fetch('/api/contracts/deploy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: address,
                contractId: currentContract.id,
                contractAddress: result.contractAddress,
                transactionHash: result.transactionHash,
                network: deployParams.network,
              }),
            });

            if (!response.ok) {
              addLog('⚠️ Warning: Failed to record deployment in database');
            }
          } catch (dbError) {
            addLog('⚠️ Warning: Database recording failed');
          }

          // Update local store
          const deployment = {
            id: Date.now().toString(),
            contractAddress: result.contractAddress,
            transactionHash: result.transactionHash,
            blockNumber: verification.blockNumber || BigInt(0),
            gasUsed: verification.gasUsed || BigInt(0),
            gasPrice: verification.gasPrice || BigInt(0),
            network: deployParams.network,
            status: 'confirmed' as const,
            createdAt: new Date(),
            contractId: currentContract.id,
          };

          addDeployment(deployment);
          
          // Update contract status
          updateContract(currentContract.id, { status: 'deployed' });

          setDeploymentResult({
            success: true,
            transactionHash: result.transactionHash,
            contractAddress: result.contractAddress,
          });

          addLog('🎉 Deployment completed successfully!');
          toast.success('Contract deployed successfully!');
        } else {
          addLog('❌ Deployment verification failed');
          toast.error('Deployment verification failed');
        }
      } else {
        addLog(`❌ Deployment failed: ${result.error}`);
        toast.error('Deployment failed');
        setDeploymentResult({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown deployment error';
      addLog(`❌ Deployment failed: ${errorMessage}`);
      toast.error('Deployment failed');
      setDeploymentResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsDeploying(false);
    }
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

  if (!currentContract) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-center max-w-md">
          <div 
            className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
          >
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-100 mb-3">No Contract Selected</h2>
          <p className="text-slate-400 mb-6">
            Please select a compiled contract to deploy to the Sei network
          </p>
          <button
            onClick={() => window.location.href = '#editor'}
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            }}
          >
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  const explorerUrl = deployParams.network === 'sei-mainnet' 
    ? 'https://seitrace.com' 
    : 'https://testnet.seitrace.com';

  return (
    <div className="h-full bg-slate-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">Deploy Contract</h1>
            <p className="text-slate-400">Deploy your smart contract to the Sei blockchain</p>
          </div>
          <div className="flex items-center space-x-4">
            <div 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                isConnected 
                  ? 'bg-green-600 bg-opacity-20 border border-green-600 border-opacity-30' 
                  : 'bg-red-600 bg-opacity-20 border border-red-600 border-opacity-30'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-slate-300">
                {isConnected ? `Connected: ${address?.slice(0, 6)}...` : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Network Configuration */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Network Configuration</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Network</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'sei-testnet', label: 'Sei Testnet', desc: 'Recommended for testing', color: '#16a34a' },
                      { value: 'sei-mainnet', label: 'Sei Mainnet', desc: 'Production network', color: '#dc2626' },
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Gas Price (Gwei)</label>
                    <input
                      type="number"
                      value={deployParams.gasPrice}
                      onChange={(e) => handleParamChange('gasPrice', e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Gas Limit</label>
                    <input
                      type="number"
                      value={deployParams.gasLimit}
                      onChange={(e) => handleParamChange('gasLimit', e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Constructor Parameters */}
            {Object.keys(deployParams.constructorArgs).length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Constructor Parameters</h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(deployParams.constructorArgs).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-slate-300 mb-2 capitalize">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleArgChange(key, e.target.value)}
                        className="form-control"
                        placeholder={`Enter ${key}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pre-deployment Checks */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Pre-deployment Checks</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Contract Compiled', check: !!currentContract.bytecode },
                  { label: 'ABI Available', check: !!currentContract.abi },
                  { label: 'Wallet Connected', check: isConnected },
                  { label: 'Network Selected', check: !!deployParams.network },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{item.label}</span>
                    <div className="flex items-center space-x-2">
                      {item.check ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs ${item.check ? 'text-green-400' : 'text-red-400'}`}>
                        {item.check ? 'Ready' : 'Missing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deploy Actions */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">Deploy Actions</h3>
                  {estimatedGas && (
                    <div className="text-sm text-slate-400">
                      Est. Gas: {estimatedGas.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={estimateGas}
                  disabled={!isConnected || !currentContract.bytecode || isDeploying}
                  className="btn btn-secondary w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Estimate Gas</span>
                </button>
                
                <button
                  onClick={deployContract}
                  disabled={!isConnected || !currentContract.bytecode || !currentContract.abi || isDeploying}
                  className="btn btn-warning w-full"
                  style={{
                    background: isDeploying ? '#475569' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  <span>{isDeploying ? 'Deploying...' : 'Deploy Contract'}</span>
                </button>
              </div>
              
              {(!currentContract.bytecode || !currentContract.abi) && (
                <div className="mt-4 p-3 bg-yellow-600 bg-opacity-20 border border-yellow-600 border-opacity-30 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    Contract must be compiled with bytecode and ABI before deployment
                  </p>
                </div>
              )}
            </div>

            {/* Deployment Result */}
            {deploymentResult && (
              <div 
                className={`card ${
                  deploymentResult.success 
                    ? 'border-green-600 bg-green-600 bg-opacity-10' 
                    : 'border-red-600 bg-red-600 bg-opacity-10'
                }`}
              >
                <div className="card-header">
                  <h3 className="card-title flex items-center">
                    {deploymentResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                    )}
                    {deploymentResult.success ? 'Deployment Successful' : 'Deployment Failed'}
                  </h3>
                </div>
                
                {deploymentResult.success && deploymentResult.contractAddress && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Contract Address</label>
                      <div className="p-3 bg-slate-700 rounded-lg font-mono text-sm text-slate-100 break-all">
                        {deploymentResult.contractAddress}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Transaction Hash</label>
                      <div className="p-3 bg-slate-700 rounded-lg flex items-center justify-between">
                        <span className="font-mono text-sm text-slate-100 break-all">
                          {deploymentResult.transactionHash}
                        </span>
                        <a
                          href={`${explorerUrl}/tx/${deploymentResult.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 ml-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                {deploymentResult.error && (
                  <div className="p-3 bg-red-600 bg-opacity-20 rounded-lg">
                    <p className="text-red-400 text-sm">{deploymentResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deployment Console & Contract Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deployment Console */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">Deployment Console</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isDeploying ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-sm text-slate-400">
                      {isDeploying ? 'Deploying' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="h-80">
                <Terminal output={deploymentLogs} />
              </div>
            </div>

            {/* Contract Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Contract Information</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[
                    { label: 'Name', value: currentContract.name },
                    { label: 'Type', value: currentContract.type.toUpperCase() },
                    { label: 'Status', value: currentContract.status, isStatus: true },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">{item.label}:</span>
                      {item.isStatus ? (
                        <span className={`badge ${
                          currentContract.status === 'deployed' ? 'badge-success' : 
                          currentContract.status === 'compiled' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {item.value}
                        </span>
                      ) : (
                        <span className="text-slate-200 text-sm">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Features:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentContract.features.map(feature => (
                        <span key={feature} className="badge badge-secondary text-xs">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Compiled:</span>
                    <div className="flex items-center space-x-2">
                      {currentContract.bytecode ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-sm ${currentContract.bytecode ? 'text-green-400' : 'text-red-400'}`}>
                        {currentContract.bytecode ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Last Modified:</span>
                    <span className="text-slate-200 text-sm">
                      {currentContract.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}