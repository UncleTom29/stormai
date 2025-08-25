/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AIContractResult {
  success: boolean;
  contractCode?: string;
  contractName?: string;
  symbol?: string;
  contractType?: 'erc20' | 'erc721' | 'erc1155' | 'governance' | 'custom';
  features?: string[];
  explanation?: string;
  error?: string;
}

export async function generateOpenAIContract(prompt: string, context?: any): Promise<AIContractResult> {
  try {
    const response = await fetch('/api/ai/generate-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        contractCode: data.contractCode,
        contractName: data.contractName,
        symbol: data.symbol,
        contractType: data.contractType,
        features: data.features,
        explanation: data.explanation,
      };
    } else {
      return {
        success: false,
        error: data.error || 'AI generation failed',
      };
    }
  } catch (error) {
    console.error('OpenAI contract generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI service unavailable',
    };
  }
}