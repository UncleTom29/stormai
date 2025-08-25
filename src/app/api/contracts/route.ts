import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateContract } from '@/lib/contract-templates';

// GET - Fetch user contracts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const contracts = await prisma.contract.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest deployment for each contract
        },
      },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST - Create new contract
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      name,
      symbol,
      type,
      features = [],
      parameters = {},
      sourceCode,
    } = await request.json();

    if (!userId || !name || !type) {
      return NextResponse.json(
        { error: 'User ID, name, and type are required' },
        { status: 400 }
      );
    }

    let finalSourceCode = sourceCode;

    // Generate contract code if not provided
    if (!finalSourceCode) {
      try {
        finalSourceCode = generateContract(type, name, features, parameters);
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to generate contract code' },
          { status: 400 }
        );
      }
    }

    // Ensure user exists
    await prisma.user.upsert({
      where: { address: userId },
      update: {},
      create: { address: userId },
    });

    const contract = await prisma.contract.create({
      data: {
        userId,
        name,
        symbol,
        type,
        sourceCode: finalSourceCode,
        features,
        parameters,
        status: 'draft',
      },
    });

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}

// PUT - Update existing contract
export async function PUT(request: NextRequest) {
  try {
    const { contractId, userId, ...updates } = await request.json();

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: 'Contract ID and User ID are required' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.update({
      where: {
        id: contractId,
        userId,
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

// DELETE - Delete contract
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');
    const userId = searchParams.get('userId');

    if (!contractId || !userId) {
      return NextResponse.json(
        { error: 'Contract ID and User ID are required' },
        { status: 400 }
      );
    }

    await prisma.contract.delete({
      where: {
        id: contractId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}