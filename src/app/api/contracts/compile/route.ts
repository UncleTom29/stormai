import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { contractId, userId, bytecode, abi, gasEstimate } = await request.json();

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: 'Contract ID and User ID are required' },
        { status: 400 }
      );
    }

    // Update contract with compilation results
    const contract = await prisma.contract.update({
      where: {
        id: contractId,
        userId: userId,
      },
      data: {
        status: 'compiled',
        bytecode: bytecode || null,
        abi: abi || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      contract,
      gasEstimate: gasEstimate || null
    });
  } catch (error) {
    console.error('Compilation update error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update compilation status',
      },
      { status: 500 }
    );
  }
}