/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { generateContract, contractTemplates } from '@/lib/contract-templates';
import { CodePreview } from './CodePreview';
import { Sparkles, ArrowRight, Copy, Save, Zap, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateText } from 'ai';

interface WizardFormData {
  contractType: 'erc20' | 'erc721' | 'erc1155' | 'governance' | 'custom';
  contractName: string;
  symbol: string;
  initialSupply: string;
  features: string[];
  aiPrompt: string;
}

export function WizardPanel() {
  const { setCurrentPanel, addContract, setCurrentContract } = useAppStore();
  const [formData, setFormData] = useState<WizardFormData>({
    contractType: 'erc20',
    contractName: 'MyToken',
    symbol: 'MTK',
    initialSupply: '1000000',
    features: ['ownable'],
    aiPrompt: '',
  });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Available features based on contract type
  const getAvailableFeatures = (type: string) => {
    const template = contractTemplates[type as keyof typeof contractTemplates];
    return template?.features || [];
  };

  const availableFeatures = getAvailableFeatures(formData.contractType);

  // Generate contract code whenever form data changes
  useEffect(() => {
    try {
      const code = generateContract(
        formData.contractType,
        formData.contractName,
        formData.features,
        {
          name: formData.contractName,
          symbol: formData.symbol,
          initialSupply: formData.initialSupply,
        }
      );
      setGeneratedCode(code);
    } catch (error) {
      console.error('Error generating contract:', error);
      setGeneratedCode('// Error generating contract code');
    }
  }, [formData]);

  const handleInputChange = (field: keyof WizardFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCodeChange = (newCode: string) => {
    setGeneratedCode(newCode);
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleAIGenerate = async () => {
    if (!formData.aiPrompt.trim()) {
      toast.error('Please enter an AI prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = formData.aiPrompt.toLowerCase();
      let newFormData = { ...formData };

      // Check for simple keywords first for fast response
      const hasKeywords = prompt.includes('nft') || prompt.includes('721') || 
                         prompt.includes('governance') || prompt.includes('voting') ||
                         prompt.includes('multi') || prompt.includes('1155') ||
                         prompt.includes('mintable') || prompt.includes('mint') ||
                         prompt.includes('burnable') || prompt.includes('burn') ||
                         prompt.includes('pausable') || prompt.includes('pause');

      if (hasKeywords && formData.aiPrompt.length < 50) {
        // Use keyword-based logic for simple prompts
        if (prompt.includes('nft') || prompt.includes('721')) {
          newFormData.contractType = 'erc721';
          newFormData.features = ['ownable'];
          newFormData.contractName = 'MyNFT';
          newFormData.symbol = 'MNFT';
        } else if (prompt.includes('governance') || prompt.includes('voting')) {
          newFormData.contractType = 'governance';
          newFormData.features = [];
          newFormData.contractName = 'GovernanceToken';
          newFormData.symbol = 'GOV';
        } else if (prompt.includes('multi') || prompt.includes('1155')) {
          newFormData.contractType = 'erc1155';
          newFormData.features = ['ownable'];
          newFormData.contractName = 'MultiToken';
          newFormData.symbol = 'MULTI';
        }

        // Add specific features
        if (prompt.includes('mintable') || prompt.includes('mint')) {
          if (!newFormData.features.includes('mintable')) {
            newFormData.features.push('mintable');
          }
        }

        if (prompt.includes('burnable') || prompt.includes('burn')) {
          if (!newFormData.features.includes('burnable')) {
            newFormData.features.push('burnable');
          }
        }

        if (prompt.includes('pausable') || prompt.includes('pause')) {
          if (!newFormData.features.includes('pausable')) {
            newFormData.features.push('pausable');
          }
        }

        setFormData(newFormData);
        toast.success('Contract configured from keywords!');
      } else {
        // Use AI for complex prompts
        try {
          toast.loading('AI is analyzing your request...', { id: 'ai-generate' });

          const response = await fetch('/api/ai/analyze-contract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: formData.aiPrompt,
              currentConfig: {
                contractType: formData.contractType,
                contractName: formData.contractName,
                symbol: formData.symbol,
                initialSupply: formData.initialSupply,
                features: formData.features
              }
            }),
          });

          if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
          }

          const aiResult = await response.json();
          
          if (aiResult.success && aiResult.suggestion) {
            const suggestion = aiResult.suggestion;
            
            newFormData = {
              ...formData,
              contractType: suggestion.contractType || formData.contractType,
              contractName: suggestion.contractName || formData.contractName,
              symbol: suggestion.symbol || formData.symbol,
              initialSupply: suggestion.initialSupply || formData.initialSupply,
              features: suggestion.features || formData.features,
            };

            setFormData(newFormData);
            toast.success(`AI: ${suggestion.reasoning}`, { id: 'ai-generate' });
          } else {
            throw new Error(aiResult.error || 'AI analysis failed');
          }
        } catch (aiError) {
          console.error('AI generation failed:', aiError);
          toast.error('AI unavailable, using smart keyword matching...', { id: 'ai-generate' });
          
          // Enhanced fallback with keyword matching
          if (prompt.includes('token') && !prompt.includes('nft')) {
            newFormData.contractType = 'erc20';
            newFormData.features = ['ownable', 'mintable'];
            newFormData.contractName = 'MyToken';
            newFormData.symbol = 'MTK';
          } else if (prompt.includes('collectible') || prompt.includes('art') || prompt.includes('unique')) {
            newFormData.contractType = 'erc721';
            newFormData.features = ['ownable'];
            newFormData.contractName = 'MyNFT';
            newFormData.symbol = 'MNFT';
          } else if (prompt.includes('voting') || prompt.includes('dao')) {
            newFormData.contractType = 'governance';
            newFormData.features = [];
            newFormData.contractName = 'GovernanceToken';
            newFormData.symbol = 'GOV';
          } else if (prompt.includes('game') || prompt.includes('item')) {
            newFormData.contractType = 'erc1155';
            newFormData.features = ['ownable'];
            newFormData.contractName = 'GameToken';
            newFormData.symbol = 'GAME';
          } else {
            // Default to ERC20 for any token-related prompt
            newFormData.contractType = 'erc20';
            newFormData.features = ['ownable'];
            newFormData.contractName = 'MyToken';
            newFormData.symbol = 'MTK';
          }

          // Extract potential contract name from prompt
          const words = formData.aiPrompt.split(' ');
          const potentialName = words.find(word => 
            word.length > 3 && 
            /^[A-Z][a-zA-Z]*$/.test(word) &&
            !['Create', 'Make', 'Build', 'Smart', 'Contract'].includes(word)
          );
          if (potentialName) {
            newFormData.contractName = potentialName;
            newFormData.symbol = potentialName.slice(0, 4).toUpperCase();
          }

          setFormData(newFormData);
          toast.success('Contract configured with smart matching!');
        }
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to analyze prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleSaveContract = async () => {
    try {
      const contract = {
        id: Date.now().toString(),
        name: formData.contractName,
        symbol: formData.symbol,
        type: formData.contractType,
        sourceCode: generatedCode,
        features: formData.features,
        parameters: {
          initialSupply: formData.initialSupply,
        },
        status: 'draft' as const,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addContract(contract);
      setCurrentContract(contract);
      toast.success('Contract saved successfully!');
    } catch (error) {
      toast.error('Failed to save contract');
    }
  };

  const handleCompileContract = async () => {
    setIsCompiling(true);
    try {
      await handleSaveContract();
      
      // Simulate compilation process
      toast.loading('Compiling contract...', { id: 'compile' });
      
      // In a real implementation, you would:
      // 1. Send code to Solidity compiler
      // 2. Get bytecode and ABI
      // 3. Update contract with compilation results
      
      setTimeout(() => {
        toast.success('Contract compiled successfully!', { id: 'compile' });
        // Update contract status to compiled
        const contract = {
          id: Date.now().toString(),
          name: formData.contractName,
          symbol: formData.symbol,
          type: formData.contractType,
          sourceCode: generatedCode,
          bytecode: '0x608060405234801561001057600080fd5b50...', // Mock bytecode
          abi: [{"type":"constructor","inputs":[]}], // Mock ABI
          features: formData.features,
          parameters: { initialSupply: formData.initialSupply },
          status: 'compiled' as const,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        addContract(contract);
        setCurrentContract(contract);
      }, 2000);
    } catch (error) {
      toast.error('Compilation failed', { id: 'compile' });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCompileAndDeploy = async () => {
    setIsDeploying(true);
    try {
      await handleCompileContract();
      
      setTimeout(() => {
        setCurrentPanel('deploy');
        toast.success('Redirecting to deployment panel...');
      }, 2500);
    } catch (error) {
      toast.error('Failed to compile and deploy');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSwitchToEditor = () => {
    handleSaveContract();
    setCurrentPanel('editor');
  };

  return (
    <div className="flex h-full">
      {/* Configuration Panel */}
      <div className="w-1/2 bg-slate-800 border-r border-slate-700 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Contract Wizard</h2>
          <p className="text-slate-400 text-sm">
            Create smart contracts with guided configuration and AI assistance
          </p>
        </div>
        
        {/* Contract Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Contract Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'erc20', label: 'ERC-20 Token', desc: 'Fungible tokens' },
              { value: 'erc721', label: 'ERC-721 NFT', desc: 'Unique tokens' },
              { value: 'erc1155', label: 'ERC-1155 Multi', desc: 'Multi-token' },
              { value: 'governance', label: 'Governance', desc: 'Voting tokens' },
            ].map((type) => (
              <div
                key={type.value}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.contractType === type.value
                    ? 'border-blue-400 bg-blue-600 bg-opacity-20'
                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
                onClick={() => handleInputChange('contractType', type.value)}
              >
                <div className="font-medium text-slate-100 text-sm">{type.label}</div>
                <div className="text-xs text-slate-400">{type.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Basic Parameters */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contract Name
            </label>
            <input
              type="text"
              value={formData.contractName}
              onChange={(e) => handleInputChange('contractName', e.target.value)}
              placeholder="MyToken"
              className="form-control"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Symbol
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value)}
              placeholder="MTK"
              className="form-control"
            />
          </div>
          
          {(formData.contractType === 'erc20' || formData.contractType === 'governance') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Initial Supply
              </label>
              <input
                type="number"
                value={formData.initialSupply}
                onChange={(e) => handleInputChange('initialSupply', e.target.value)}
                placeholder="1000000"
                className="form-control"
              />
            </div>
          )}
        </div>

        {/* Features */}
        {availableFeatures.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Features
            </label>
            <div className="space-y-3">
              {['ownable', ...availableFeatures].map((feature) => (
                <label key={feature} className="flex items-center space-x-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="sr-only"
                    />
                    <div 
                      className={`w-5 h-5 border-2 rounded transition-all ${
                        formData.features.includes(feature)
                          ? 'border-blue-400 bg-blue-600'
                          : 'border-slate-500 bg-slate-700 group-hover:border-slate-400'
                      }`}
                    >
                      {formData.features.includes(feature) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-300 capitalize group-hover:text-slate-200">
                    {feature.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* AI Prompt */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            AI Description (Optional)
          </label>
          <textarea
            value={formData.aiPrompt}
            onChange={(e) => handleInputChange('aiPrompt', e.target.value)}
            placeholder="e.g., Create an NFT contract with royalties and soulbound option"
            className="form-control"
            style={{ minHeight: '80px' }}
          />
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="btn btn-success mt-3"
            style={{
              background: isGenerating ? '#475569' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span>{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyCode}
              className="btn btn-secondary"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
            <button
              onClick={handleSaveContract}
              className="btn btn-secondary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
          
          <button
            onClick={handleCompileContract}
            disabled={isCompiling}
            className="btn btn-warning w-full"
            style={{
              background: isCompiling ? '#475569' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            <span>{isCompiling ? 'Compiling...' : 'Compile Contract'}</span>
          </button>
          
          <button
            onClick={handleCompileAndDeploy}
            disabled={isDeploying || isCompiling}
            className="btn btn-primary w-full"
            style={{
              background: (isDeploying || isCompiling) ? '#475569' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            <span>{isDeploying ? 'Preparing Deploy...' : 'Compile & Deploy'}</span>
          </button>
          
          <button
            onClick={handleSwitchToEditor}
            className="btn btn-secondary w-full flex items-center justify-center"
          >
            <span>Switch to Advanced Editor</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Code Preview */}
      <div className="w-1/2 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Contract Preview</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleCopyCode}
              className="btn btn-sm btn-secondary"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </button>
            <button
              onClick={handleSaveContract}
              className="btn btn-sm btn-secondary"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
          </div>
        </div>
        <div className="h-full">
          <CodePreview 
            code={generatedCode} 
            language="solidity" 
            readOnly={false}
            onChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
}