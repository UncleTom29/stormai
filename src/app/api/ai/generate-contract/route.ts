// app/api/ai/generate-contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert Solidity smart contract developer. Generate complete, secure, and gas-optimized smart contracts based on user requirements.

Guidelines:
1. Always use Solidity ^0.8.20
2. Use OpenZeppelin contracts for security
3. Include proper license headers (MIT)
4. Add comprehensive NatSpec comments
5. Follow best practices for security and gas optimization
6. Include proper error handling
7. Make contracts upgradeable when appropriate

Response format should be a JSON object with:
{
  "contractCode": "complete solidity contract code",
  "contractName": "extracted contract name",
  "symbol": "token symbol if applicable",
  "contractType": "erc20|erc721|erc1155|governance|custom",
  "features": ["array of features used"],
  "explanation": "brief explanation of the contract"
}

Common contract types:
- ERC20: Fungible tokens
- ERC721: NFTs (Non-fungible tokens)
- ERC1155: Multi-token standard
- Governance: DAO voting tokens
- Custom: Specialized contracts

Available features: ownable, mintable, burnable, pausable, capped, permit, enumerable, uri_storage, royalty, supply`;

    const userPrompt = `Generate a Solidity smart contract based on this requirement: "${prompt}"

${context ? `Additional context: ${JSON.stringify(context)}` : ''}

Please provide a complete, production-ready contract that follows best practices and is secure. Return the response as a JSON object with the specified fields.`;

    const { text } = await generateText({
      model: openai('gpt-4-turbo-preview'),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 3000,
      temperature: 0.7,
    });

    // Try to parse the JSON response
    let parsedResponse;
    try {
      // Look for JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: extract information manually
      console.warn('Failed to parse AI response as JSON, extracting manually');
      
      const contractCode = extractContractCode(text);
      const contractName = extractContractName(text, contractCode);
      const symbol = extractSymbol(text, contractCode);
      const contractType = detectContractType(text, contractCode);
      const features = extractFeatures(text, contractCode);

      parsedResponse = {
        contractCode,
        contractName,
        symbol,
        contractType,
        features,
        explanation: 'Contract generated based on your requirements',
      };
    }

    // Validate the response
    if (!parsedResponse.contractCode) {
      return NextResponse.json(
        { error: 'Failed to generate valid contract code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...parsedResponse,
    });

  } catch (error) {
    console.error('AI contract generation error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API configuration error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate contract with AI' },
      { status: 500 }
    );
  }
}

// Helper functions for parsing AI responses
function extractContractCode(text: string): string | undefined {
  // Look for code blocks with solidity
  const solidityMatch = text.match(/```solidity\n([\s\S]*?)```/);
  if (solidityMatch) {
    return solidityMatch[1].trim();
  }

  // Look for generic code blocks
  const codeMatch = text.match(/```\n([\s\S]*?)```/);
  if (codeMatch) {
    const code = codeMatch[1].trim();
    // Check if it looks like Solidity
    if (code.includes('pragma solidity') || code.includes('contract ')) {
      return code;
    }
  }

  // Look for contract definition without code blocks
  const contractMatch = text.match(/(\/\/ SPDX[\s\S]*?(?=\n\n|$))/);
  if (contractMatch) {
    return contractMatch[1].trim();
  }

  return undefined;
}

function extractContractName(text: string, contractCode?: string): string | undefined {
  // First try to extract from contract code
  if (contractCode) {
    const match = contractCode.match(/contract\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (match) {
      return match[1];
    }
  }

  // Try to extract from text description
  const patterns = [
    /contract name[:\s]+([A-Za-z_][A-Za-z0-9_]*)/i,
    /name[:\s]+([A-Za-z_][A-Za-z0-9_]*)/i,
    /"([A-Za-z_][A-Za-z0-9_]*)"\s+contract/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

function extractSymbol(text: string, contractCode?: string): string | undefined {
  // First try to extract from contract code
  if (contractCode) {
    const match = contractCode.match(/symbol[:\s]*"([A-Za-z0-9]+)"/i);
    if (match) {
      return match[1];
    }
  }

  // Try to extract from text description
  const patterns = [
    /symbol[:\s]+"([A-Za-z0-9]+)"/i,
    /symbol[:\s]+([A-Z]{2,6})/i,
    /ticker[:\s]+([A-Z]{2,6})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

function detectContractType(text: string, contractCode?: string): 'erc20' | 'erc721' | 'erc1155' | 'governance' | 'custom' {
  const content = (text + ' ' + (contractCode || '')).toLowerCase();

  if (content.includes('erc721') || content.includes('nft') || content.includes('non-fungible')) {
    return 'erc721';
  }
  if (content.includes('erc1155') || content.includes('multi-token') || content.includes('multi token')) {
    return 'erc1155';
  }
  if (content.includes('governance') || content.includes('voting') || content.includes('dao')) {
    return 'governance';
  }
  if (content.includes('erc20') || content.includes('token') || content.includes('fungible')) {
    return 'erc20';
  }

  return 'custom';
}

function extractFeatures(text: string, contractCode?: string): string[] {
  const content = (text + ' ' + (contractCode || '')).toLowerCase();
  const features: string[] = [];

  const featureMap = {
    mintable: ['mintable', 'mint', 'minting'],
    burnable: ['burnable', 'burn', 'burning'],
    pausable: ['pausable', 'pause', 'pausing'],
    capped: ['capped', 'cap', 'maximum supply'],
    permit: ['permit', 'signature', 'meta-transaction'],
    enumerable: ['enumerable', 'enumerate', 'list all tokens'],
    uri_storage: ['uri storage', 'metadata', 'token uri'],
    royalty: ['royalty', 'royalties', 'creator fee'],
    ownable: ['ownable', 'owner', 'ownership'],
  };

  for (const [feature, keywords] of Object.entries(featureMap)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      features.push(feature);
    }
  }

  // Always include ownable by default
  if (!features.includes('ownable')) {
    features.push('ownable');
  }

  return features;
}