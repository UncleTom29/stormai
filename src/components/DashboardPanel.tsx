'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAccount } from 'wagmi';
import { 
  FileText, 
  CheckCircle, 
  Zap, 
  TrendingUp,
  ExternalLink,
  Play,
  Eye,
  Edit,
  Trash2,
  Plus,
  Activity,
  Clock,
  Code2,
  Wallet
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalContracts: number;
  deployedContracts: number;
  totalGasUsed: bigint;
  successRate: number;
}

export function DashboardPanel() {
  const { contracts, deployments, setCurrentPanel, setCurrentContract, deleteContract } = useAppStore();
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    deployedContracts: 0,
    totalGasUsed: BigInt(0),
    successRate: 0,
  });
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  useEffect(() => {
    // Calculate stats
    const deployedCount = contracts.filter(c => c.status === 'deployed').length;
    const totalGas = deployments.reduce((sum, d) => sum + d.gasUsed, BigInt(0));
    const successfulDeployments = deployments.filter(d => d.status === 'confirmed').length;
    const successRate = deployments.length > 0 ? (successfulDeployments / deployments.length) * 100 : 0;

    setStats({
      totalContracts: contracts.length,
      deployedContracts: deployedCount,
      totalGasUsed: totalGas,
      successRate: Math.round(successRate * 10) / 10,
    });
  }, [contracts, deployments]);

  const handleContractAction = (contractId: string, action: 'view' | 'edit' | 'delete') => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    switch (action) {
      case 'view':
        setCurrentContract(contract);
        setCurrentPanel('editor');
        break;
      case 'edit':
        setCurrentContract(contract);
        setCurrentPanel('wizard');
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this contract?')) {
          deleteContract(contractId);
          toast.success('Contract deleted');
        }
        break;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatGas = (gas: bigint) => {
    const gasNumber = Number(gas);
    if (gasNumber >= 1e9) {
      return `${(gasNumber / 1e9).toFixed(1)}B`;
    } else if (gasNumber >= 1e6) {
      return `${(gasNumber / 1e6).toFixed(1)}M`;
    } else if (gasNumber >= 1e3) {
      return `${(gasNumber / 1e3).toFixed(1)}K`;
    }
    return gasNumber.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'badge badge-success';
      case 'compiled':
        return 'badge badge-info';
      case 'draft':
        return 'badge badge-warning';
      default:
        return 'badge badge-secondary';
    }
  };

  if (!isConnected) {
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
            <Wallet className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-100 mb-3">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6">
            Connect your wallet to access your dashboard and manage your smart contracts
          </p>
          <button 
            className="btn btn-primary btn-lg"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
            }}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2">Dashboard</h1>
            <p className="text-slate-400">Manage your smart contracts and track deployments</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Balance:</span>
              <span className="font-semibold text-slate-100">1,250.5 SEI</span>
            </div>
            <div 
              className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              {address ? address[2].toUpperCase() : '?'}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Contracts',
              value: stats.totalContracts.toString(),
              icon: FileText,
              color: '#2563eb',
              gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              change: '+12%',
            },
            {
              title: 'Deployed',
              value: stats.deployedContracts.toString(),
              icon: CheckCircle,
              color: '#16a34a',
              gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              change: '+8%',
            },
            {
              title: 'Gas Used',
              value: formatGas(stats.totalGasUsed),
              icon: Zap,
              color: '#ea580c',
              gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              change: '-5%',
            },
            {
              title: 'Success Rate',
              value: `${stats.successRate}%`,
              icon: TrendingUp,
              color: '#7c3aed',
              gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              change: '+2%',
            },
          ].map((stat, index) => (
            <div 
              key={index}
              className="card group cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: '1px solid #475569',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.borderColor = stat.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#475569';
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400 uppercase tracking-wide font-medium">
                    {stat.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
                    <span className="text-xs text-green-400 font-medium">{stat.change}</span>
                  </div>
                </div>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: stat.gradient }}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    background: stat.gradient,
                    width: '70%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="card-title">Your Contracts</h3>
                  <button
                    onClick={() => setCurrentPanel('wizard')}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Contract
                  </button>
                </div>
              </div>

              {contracts.length === 0 ? (
                <div className="text-center py-12">
                  <Code2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">No Contracts Yet</h3>
                  <p className="text-slate-400 mb-6">Create your first smart contract to get started</p>
                  <button
                    onClick={() => setCurrentPanel('wizard')}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    }}
                  >
                    Create Contract
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Contract</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.slice(0, 5).map((contract) => {
                        const deployment = deployments.find(d => d.contractId === contract.id);
                        
                        return (
                          <tr key={contract.id}>
                            <td>
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                                  style={{
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                  }}
                                >
                                  {contract.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-100">{contract.name}</div>
                                  {deployment && (
                                    <div className="text-xs text-slate-400 font-mono">
                                      {formatAddress(deployment.contractAddress)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="text-slate-300 capitalize">
                                {contract.type.replace(/(\d+)/, '-$1')}
                              </span>
                            </td>
                            <td>
                              <span className={getStatusBadge(contract.status)}>
                                {contract.status}
                              </span>
                            </td>
                            <td>
                              <span className="text-slate-400 text-sm">
                                {contract.createdAt.toLocaleDateString()}
                              </span>
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleContractAction(contract.id, 'view')}
                                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1 transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => handleContractAction(contract.id, 'edit')}
                                  className="text-slate-400 hover:text-slate-300 text-sm flex items-center space-x-1 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleContractAction(contract.id, 'delete')}
                                  className="text-red-400 hover:text-red-300 text-sm flex items-center space-x-1 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Deployments */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Deployments</h3>
            </div>
            
            {deployments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No deployments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deployments.slice(0, 5).map((deployment) => (
                  <div 
                    key={deployment.id} 
                    className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          deployment.status === 'confirmed' ? 'bg-green-400' : 
                          deployment.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          {contracts.find(c => c.id === deployment.contractId)?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {deployment.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-200 cursor-pointer" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Create Token', 
                desc: 'ERC-20 Token',
                icon: '🪙',
                action: () => setCurrentPanel('wizard'),
                color: '#2563eb'
              },
              { 
                label: 'Create NFT', 
                desc: 'ERC-721 Collection',
                icon: '🎨',
                action: () => setCurrentPanel('wizard'),
                color: '#16a34a'
              },
              { 
                label: 'Open Editor', 
                desc: 'Code Editor',
                icon: '💻',
                action: () => setCurrentPanel('editor'),
                color: '#ea580c'
              },
              { 
                label: 'Deploy Contract', 
                desc: 'To Sei Network',
                icon: '🚀',
                action: () => setCurrentPanel('deploy'),
                color: '#7c3aed'
              },
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-4 bg-slate-700 border border-slate-600 rounded-lg hover:border-slate-500 transition-all text-left group"
                style={{
                  background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#475569';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="font-medium text-slate-100 group-hover:text-white transition-colors">
                  {action.label}
                </div>
                <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}