/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPublicClient, http } from 'viem';
import { seiMainnet, seiTestnet } from '@/lib/wagmi';

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      contractId,
      contractAddress,
      transactionHash,
      network,
    } = await request.json();

    if (!userId || !contractId || !contractAddress || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required deployment data' },
        { status: 400 }
      );
    }

    // Verify the transaction exists on-chain
    const chain = network === 'sei-mainnet' ? seiMainnet : seiTestnet;
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      });

      // Create deployment record with actual blockchain data
      const deployment = await prisma.deployment.create({
        data: {
          userId,
          contractId,
          contractAddress,
          transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          gasPrice: receipt.effectiveGasPrice,
          network,
          status: receipt.status === 'success' ? 'confirmed' : 'failed',
        },
      });

      // Update contract status if deployment successful
      if (receipt.status === 'success') {
        await prisma.contract.update({
          where: {
            id: contractId,
            userId,
          },
          data: {
            status: 'deployed',
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({ 
        deployment: {
          ...deployment,
          blockNumber: deployment.blockNumber?.toString(),
          gasUsed: deployment.gasUsed?.toString(),
          gasPrice: deployment.gasPrice?.toString(),
        }
      });
    } catch (txError) {
      // If we can't verify the transaction, still record it as pending
      const deployment = await prisma.deployment.create({
        data: {
          userId,
          contractId,
          contractAddress,
          transactionHash,
          network,
          status: 'pending',
          errorMessage: 'Could not verify transaction on-chain',
        },
      });

      return NextResponse.json({ 
        deployment,
        warning: 'Transaction recorded but could not be verified on-chain'
      });
    }
  } catch (error) {
    console.error('Error recording deployment:', error);
    return NextResponse.json(
      { error: 'Failed to record deployment' },
      { status: 500 }
    );
  }
}

// GET - Fetch deployments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contractId = searchParams.get('contractId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const where: any = { userId };
    if (contractId) {
      where.contractId = contractId;
    }

    const deployments = await prisma.deployment.findMany({
      where,
      include: {
        contract: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert BigInt to string for JSON serialization
    const serializedDeployments = deployments.map(deployment => ({
      ...deployment,
      blockNumber: deployment.blockNumber?.toString() || null,
      gasUsed: deployment.gasUsed?.toString() || null,
      gasPrice: deployment.gasPrice?.toString() || null,
    }));

    return NextResponse.json({ deployments: serializedDeployments });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployments' },
      { status: 500 }
    );
  }
}