// src/app/api/ai/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are an expert Solidity smart contract developer and AI assistant for StormAI IDE. 

Your capabilities include:
1. Smart contract analysis and optimization
2. Security best practices and vulnerability detection
3. Gas optimization suggestions
4. Code explanation and debugging
5. Contract feature recommendations
6. Solidity syntax help

Guidelines:
- Always prioritize security and best practices
- Provide specific, actionable suggestions
- Explain complex concepts clearly
- Reference OpenZeppelin contracts when appropriate
- Consider gas efficiency in recommendations
- Stay updated with latest Solidity features

When analyzing code, look for:
- Reentrancy vulnerabilities
- Access control issues
- Integer overflow/underflow
- Gas optimization opportunities
- Code structure and readability

Respond concisely but thoroughly. If you need more context, ask specific questions.`;

export async function POST(req: Request) {
  try {
    const { messages, userId, contractCode } = await req.json();

    // Add context about current contract if provided
    let contextualPrompt = SYSTEM_PROMPT;
    if (contractCode) {
      contextualPrompt += `\n\nCurrent contract code for context:\n\`\`\`solidity\n${contractCode}\n\`\`\``;
    }

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: contextualPrompt,
      messages,
      temperature: 0.3,
      maxOutputTokens: 1000,
    });

    // Save chat message to database if userId provided
    if (userId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        try {
          await prisma.chatMessage.create({
            data: {
              userId,
              message: lastMessage.content,
              response: '', // Will be updated when stream completes
              context: contractCode ? { contractCode } : undefined,
            },
          });
        } catch (error) {
          console.error('Failed to save chat message:', error);
        }
      }
    }

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response('Error processing AI request', { status: 500 });
  }
}