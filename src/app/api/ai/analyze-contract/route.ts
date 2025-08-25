/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/ai/analyze-contract/route.ts
import {  NextResponse, NextRequest } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const contractPrompt = (userPrompt: string) => `You are an expert Solidity smart contract developer. Analyze this contract request and provide structured recommendations:

Request: "${userPrompt}"

Based on this request, analyze and suggest:

1. **Contract Type**: Choose the most appropriate type:
   - erc20: For fungible tokens (currencies, utility tokens)
   - erc721: For NFTs (unique collectibles, certificates)
   - erc1155: For multi-token contracts (gaming items, multiple token types)
   - governance: For DAO tokens with voting capabilities
   - custom: For specialized contracts

2. **Contract Details**:
   - Suggested contract name (PascalCase, no spaces)
   - Suggested symbol (3-5 uppercase letters)
   - Initial supply (for tokens)

3. **Features**: Select relevant features from:
   - mintable: Allow creating new tokens after deployment
   - burnable: Allow destroying tokens
   - pausable: Emergency pause functionality
   - capped: Maximum supply limit
   - permit: Gas-less approvals
   - enumerable: Token enumeration (for NFTs)
   - uri_storage: Individual token URIs (for NFTs)
   - royalty: Creator royalties (for NFTs)
   - supply: Supply tracking (for ERC1155)

4. **Reasoning**: Brief explanation of your choices

Respond ONLY with valid JSON in this exact format:
{
  "contractType": "erc20|erc721|erc1155|governance|custom",
  "contractName": "YourContractName",
  "symbol": "SYMBOL",
  "initialSupply": "1000000",
  "features": ["feature1", "feature2"],
  "reasoning": "Brief explanation of choices"
}`;

function parseAIResponse(response: string): { success: boolean; data?: any; error?: string } {
  try {
    // Remove code blocks if present
    const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const data = JSON.parse(cleanedResponse);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

function validateAIContractSuggestion(suggestion: any): boolean {
  const requiredFields = ['contractType', 'contractName', 'features', 'reasoning'];
  const validContractTypes = ['erc20', 'erc721', 'erc1155', 'governance', 'custom'];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!suggestion[field]) return false;
  }
  
  // Validate contract type
  if (!validContractTypes.includes(suggestion.contractType)) return false;
  
  // Validate features array
  if (!Array.isArray(suggestion.features)) return false;
  
  // Validate contract name (should be alphanumeric, PascalCase)
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(suggestion.contractName)) return false;
  
  return true;
}

const defaultAIResponses = {
  token: {
    contractType: 'erc20',
    contractName: 'MyToken',
    symbol: 'MTK',
    initialSupply: '1000000',
    features: ['ownable', 'mintable'],
    reasoning: 'Standard ERC20 token with minting capability'
  },
  nft: {
    contractType: 'erc721',
    contractName: 'MyNFT',
    symbol: 'MNFT',
    features: ['ownable'],
    reasoning: 'Standard ERC721 NFT contract'
  },
  governance: {
    contractType: 'governance',
    contractName: 'GovernanceToken',
    symbol: 'GOV',
    initialSupply: '1000000',
    features: [],
    reasoning: 'Governance token with voting capabilities'
  }
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, currentConfig } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not configured, using fallback logic');
      return handleFallbackAnalysis(prompt, currentConfig);
    }

    try {
      const { text } = await generateText({
        model: openai('gpt-3.5-turbo'),
        prompt: contractPrompt(prompt),
        temperature: 0.3,
        maxOutputTokens: 500,
      });

      const parseResult = parseAIResponse(text);
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      const suggestion = parseResult.data;
      
      // Validate the AI response
      if (!validateAIContractSuggestion(suggestion)) {
        throw new Error('Invalid AI response format');
      }

      return NextResponse.json({
        success: true,
        suggestion,
        source: 'ai'
      });

    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      // Fall back to smart keyword analysis
      return handleFallbackAnalysis(prompt, currentConfig);
    }

  } catch (error) {
    console.error('Error analyzing contract request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze contract request' },
      { status: 500 }
    );
  }
}

function handleFallbackAnalysis(prompt: string, currentConfig: any) {
  const lowerPrompt = prompt.toLowerCase();
  let suggestion;

  // Smart keyword-based analysis
  if (lowerPrompt.includes('nft') || lowerPrompt.includes('721') || 
      lowerPrompt.includes('collectible') || lowerPrompt.includes('art') || 
      lowerPrompt.includes('unique')) {
    suggestion = {
      ...defaultAIResponses.nft,
      reasoning: 'Detected NFT-related keywords, suggesting ERC721 contract'
    };
  } else if (lowerPrompt.includes('governance') || lowerPrompt.includes('voting') || 
             lowerPrompt.includes('dao') || lowerPrompt.includes('proposal')) {
    suggestion = {
      ...defaultAIResponses.governance,
      reasoning: 'Detected governance-related keywords, suggesting governance token'
    };
  } else if (lowerPrompt.includes('multi') || lowerPrompt.includes('1155') || 
             lowerPrompt.includes('game') || lowerPrompt.includes('item')) {
    suggestion = {
      contractType: 'erc1155',
      contractName: 'MultiToken',
      symbol: 'MULTI',
      features: ['ownable'],
      reasoning: 'Detected multi-token keywords, suggesting ERC1155 contract'
    };
  } else {
    // Default to ERC20
    suggestion = {
      ...defaultAIResponses.token,
      reasoning: 'General token request, suggesting standard ERC20'
    };
  }

  // Add features based on keywords
  const features = [...suggestion.features];
  
  if (lowerPrompt.includes('mint') || lowerPrompt.includes('create')) {
    if (!features.includes('mintable')) features.push('mintable');
  }
  
  if (lowerPrompt.includes('burn') || lowerPrompt.includes('destroy')) {
    if (!features.includes('burnable')) features.push('burnable');
  }
  
  if (lowerPrompt.includes('pause') || lowerPrompt.includes('emergency')) {
    if (!features.includes('pausable')) features.push('pausable');
  }

  if (lowerPrompt.includes('cap') || lowerPrompt.includes('limit')) {
    if (!features.includes('capped')) features.push('capped');
  }

  // Try to extract contract name from prompt
  const words = prompt.split(/\s+/);
  const potentialName = words.find(word => 
    word.length > 2 && 
    word.length < 20 &&
    /^[A-Z][a-zA-Z]*$/.test(word) &&
    !['Create', 'Make', 'Build', 'Smart', 'Contract', 'Token', 'Coin'].includes(word)
  );

  if (potentialName) {
    suggestion.contractName = potentialName;
    suggestion.symbol = potentialName.slice(0, Math.min(5, potentialName.length)).toUpperCase();
  }

  suggestion.features = features;

  return NextResponse.json({
    success: true,
    suggestion,
    source: 'fallback'
  });
}
