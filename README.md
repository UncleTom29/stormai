# ⚡ StormAI - Autonomous Smart Contract Development Platform

<div align="center">

![StormAI Logo](./docs/logo.svg)

**The first AI-native smart contract development platform built specifically for Sei Network**

[![Sei Network](https://img.shields.io/badge/Built%20on-Sei%20Network-6366f1?style=for-the-badge)](https://sei.io)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI-00a67e?style=for-the-badge&logo=openai)](https://openai.com/)

[🚀 Live Demo](https://stormai.dev) • [🎥 Demo Video](https://youtube.com/watch?v=demo) • [🐦 X](https://x.com/stormai_dev)

</div>

## 🌊 What is StormAI?

StormAI revolutionizes smart contract development by combining artificial intelligence with Sei Network's lightning-fast infrastructure. Transform natural language descriptions into production-ready smart contracts in seconds, not weeks.

### ⚡ Built for Sei's Speed
- Leverages Sei's sub-400ms finality for instant feedback
- Optimized for Sei's parallel execution architecture  
- Custom deployment pipeline for maximum performance

### 🧠 AI-Powered Development
- Natural language to Solidity translation
- Real-time security vulnerability detection
- Intelligent code optimization and best practices

## 🎯 Key Features

### 🏗️ **Dual Development Modes**
- **🪄 Wizard Mode**: Visual contract builder for beginners
- **💻 IDE Mode**: Full-featured development environment for experts

### 🤖 **AI-Driven Intelligence**
- Natural language contract generation
- Real-time security analysis
- Smart code suggestions and optimizations

### ⚡ **Sei-Optimized Performance**
- Sub-400ms deployment confirmations
- Gas-optimized contract templates
- Native Sei testnet/mainnet integration

### 🛡️ **Security-First Architecture**
- AI-powered vulnerability detection
- Battle-tested contract templates
- Real-time security feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (optional, fallback logic included)

### Installation

```bash
# Clone the repository
git clone https://github.com/stormai-dev/stormai-platform.git
cd stormai-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start building smart contracts!

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stormai"

# OpenAI (Optional - falls back to keyword matching)
OPENAI_API_KEY="your-openai-api-key"

# Sei Network Configuration (Pre-configured)
NEXT_PUBLIC_SEI_TESTNET_RPC="https://rpc-testnet.sei-apis.com"
NEXT_PUBLIC_SEI_MAINNET_RPC="https://rpc.sei-apis.com"
```

## 🏗️ Architecture

```mermaid
graph TB
    A[User Interface] --> B[AI Engine]
    B --> C[Contract Generator]
    C --> D[Sei Integration]
    D --> E[Deployment Pipeline]
    
    B --> F[Security Analyzer]
    F --> G[Vulnerability Detection]
    
    H[Database Layer] --> I[User Contracts]
    H --> J[Deployment History]
    
    K[File System] --> L[Project Structure]
    K --> M[Template Library]
```

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 with TypeScript
- Tailwind CSS
- Monaco Editor
- Zustand State Management

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- OpenAI SDK


## 🎮 Usage Examples

### Natural Language Contract Generation

```javascript
// User input: "Create a gaming token with rewards and staking"
// StormAI generates:

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public rewardBalance;
    
    constructor() ERC20("GameToken", "GAME") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    function stake(uint256 amount) public {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        stakingBalance[msg.sender] += amount;
        _transfer(msg.sender, address(this), amount);
    }
    
    // Additional staking and reward logic...
}
```

### AI-Powered Security Analysis

```bash
# Terminal output
🔍 Security Analysis Complete
✅ No reentrancy vulnerabilities detected
✅ Access control properly implemented  
⚠️  Consider adding max supply cap
💡 Suggestion: Add pause functionality for emergency stops
```

## 📊 Project Structure

```
stormai-platform/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── ai/           # AI integration endpoints
│   │   └── contracts/    # Contract CRUD operations
│   ├── components/       # React components
│   │   ├── ui/          # UI components
│   │   └── panels/      # Main application panels
│   └── globals.css      # Global styles
├── lib/                  # Utility libraries
│   ├── ai-config.ts     # AI integration setup
│   ├── contract-templates.ts # Smart contract templates
│   ├── deployment-utils.ts   # Sei deployment utilities
│   └── wagmi.ts        # Web3 configuration
├── prisma/              # Database schema and migrations
├── docs/               # Documentation
└── public/             # Static assets
```

## 🔌 API Endpoints

### Contract Management
- `GET /api/contracts` - Fetch user contracts
- `POST /api/contracts` - Create new contract
- `PUT /api/contracts` - Update existing contract
- `DELETE /api/contracts` - Delete contract

### AI Integration
- `POST /api/ai/analyze-contract` - AI contract analysis
- `POST /api/ai/generate-tests` - Generate test cases
- `POST /api/ai/security-audit` - Security vulnerability scan

### Deployment
- `POST /api/contracts/compile` - Compile contract
- `POST /api/contracts/deploy` - Deploy to Sei network
- `GET /api/deployments` - Fetch deployment history

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:components  # React component tests
npm run test:api        # API endpoint tests
npm run test:contracts  # Smart contract tests

# Generate test coverage
npm run test:coverage
```

## 📦 Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```

### Docker Deployment

```bash
# Build Docker image
docker build -t stormai-platform .

# Run container
docker run -p 3000:3000 stormai-platform
```

## 🤝 Contributing

We welcome contributions to StormAI! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards

- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive test coverage

## 📈 Roadmap

### ✅ Phase 1 - Core Platform (Completed)
- [x] AI-powered contract generation
- [x] Sei network integration
- [x] Web-based IDE
- [x] Security analysis

### 🔄 Phase 2 - Advanced Features (In Progress)
- [ ] Multi-language support (Rust, Move)
- [ ] Advanced AI models for security
- [ ] Cross-chain compatibility
- [ ] Mobile application

### 🔮 Phase 3 - Autonomous Agents
- [ ] AI agent development tools
- [ ] Agent coordination systems
- [ ] On-chain AI inference
- [ ] Agent marketplace

## 🏆 Hackathon Submission

### The Accelerated Intelligence Project - ai/accelathon

**Track**: Tooling and Infrastructure  

#### How StormAI Addresses the Challenge:
1. **Foundational Infrastructure**: Complete smart contract development platform
2. **AI Agent Enablement**: Tools for building autonomous blockchain agents  
3. **Sei Network Integration**: Native optimization for Sei's high-performance infrastructure
4. **Developer Acceleration**: 10x faster smart contract development

#### Sei Network Integration:
- Native deployment to Sei Testnet & Mainnet
- Optimized for sub-400ms finality
- Custom gas optimization for Sei's fee structure
- Leverages Sei's parallel execution capabilities

## 📞 Support & Community

- 🐦 **Twitter**: [@stormai_dev](https://twitter.com/stormai_dev)
- 📧 **Email**: adeyemitomiwa7@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/uncletom29/stormai/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">

**Built with ❤️ for the Sei ecosystem and the future of autonomous blockchain development**

[🚀 Get Started](https://pages.stormai.dev) | [🎥 Watch Demo](https://youtube.com/watch?v=demo)

</div>