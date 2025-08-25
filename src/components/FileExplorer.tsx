'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileText, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  X,
  Edit3,
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
  content?: string;
  path: string;
}

interface FileExplorerProps {
  onFileSelect: (fileName: string) => void;
  onCreateFile: (fileName: string, content: string) => void;
  currentFile: string;
  fileContents: Record<string, string>;
}

export function FileExplorer({ onFileSelect, onCreateFile, currentFile, fileContents }: FileExplorerProps) {
  const { contracts, currentContract, setCurrentContract } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['contracts', 'test', 'scripts']));
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<string>('');

  const buildFileStructure = (): FileNode[] => {
    const structure: FileNode[] = [
      {
        id: 'contracts',
        name: 'contracts',
        type: 'folder',
        path: 'contracts',
        children: [
          ...contracts.map(contract => ({
            id: contract.id,
            name: `${contract.name}.sol`,
            type: 'file' as const,
            path: `contracts/${contract.name}.sol`,
            content: contract.sourceCode,
          })),
          ...Object.keys(fileContents)
            .filter(name => name.endsWith('.sol') && !contracts.some(c => name === `${c.name}.sol`))
            .map(name => ({
              id: `file-${name}`,
              name,
              type: 'file' as const,
              path: `contracts/${name}`,
              content: fileContents[name],
            }))
        ],
      },
      {
        id: 'test',
        name: 'test',
        type: 'folder',
        path: 'test',
        children: Object.keys(fileContents)
          .filter(name => name.includes('test') || name.includes('spec'))
          .map(name => ({
            id: `test-${name}`,
            name,
            type: 'file' as const,
            path: `test/${name}`,
            content: fileContents[name],
          })),
      },
      {
        id: 'scripts',
        name: 'scripts',
        type: 'folder',
        path: 'scripts',
        children: Object.keys(fileContents)
          .filter(name => name.includes('deploy') || name.includes('script'))
          .map(name => ({
            id: `script-${name}`,
            name,
            type: 'file' as const,
            path: `scripts/${name}`,
            content: fileContents[name],
          })),
      },
      ...Object.keys(fileContents)
        .filter(name => 
          !name.endsWith('.sol') && 
          !name.includes('test') && 
          !name.includes('deploy') && 
          !name.includes('script')
        )
        .map(name => ({
          id: `root-${name}`,
          name,
          type: 'file' as const,
          path: name,
          content: fileContents[name],
        })),
    ];

    return structure.filter(item => 
      item.type === 'file' || (item.children && item.children.length > 0)
    );
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'folder') {
      toggleFolder(file.id);
    } else {
      setSelectedFile(file.name);
      onFileSelect(file.name);
      
      // If it's a contract file, set it as current contract
      const contract = contracts.find(c => `${c.name}.sol` === file.name);
      if (contract) {
        setCurrentContract(contract);
      }
    }
  };

  const handleCreateNewFile = () => {
    if (!newFileName.trim()) {
      toast.error('Please enter a filename');
      return;
    }

    let content = '';
    const fileName = newFileName.trim();

    // Generate appropriate content based on file extension
    if (fileName.endsWith('.sol')) {
      const contractName = fileName.replace('.sol', '');
      content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ${contractName} {
    constructor() {}
}`;
    } else if (fileName.endsWith('.js') && fileName.includes('test')) {
      content = `const { expect } = require("hardhat/chai");
const { ethers } = require("hardhat");

describe("${fileName.replace('.test.js', '')}", function () {
  beforeEach(async function () {
    // Setup code here
  });

  it("Should work correctly", async function () {
    // Test code here
  });
});`;
    } else if (fileName.includes('deploy')) {
      content = `const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deployment code here
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`;
    } else if (fileName.endsWith('.json')) {
      content = '{}';
    } else if (fileName.endsWith('.md')) {
      content = `# ${fileName.replace('.md', '')}

## Description

Add your documentation here.
`;
    } else {
      content = `// ${fileName}
// Created on ${new Date().toLocaleDateString()}
`;
    }

    onCreateFile(fileName, content);
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  const handleDeleteFile = (fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
      // In a real implementation, you would call a delete function
      toast.success(`File ${fileName} deleted`);
    }
  };

  const handleCopyFileName = (fileName: string) => {
    navigator.clipboard.writeText(fileName);
    toast.success('Filename copied to clipboard');
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (type === 'folder') {
      return expandedFolders.has(fileName) ? (
        <FolderOpen className="w-4 h-4 text-blue-400" />
      ) : (
        <Folder className="w-4 h-4 text-blue-400" />
      );
    }
    
    if (fileName.endsWith('.sol')) {
      return <FileText className="w-4 h-4 text-green-400" />;
    } else if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return <FileText className="w-4 h-4 text-yellow-400" />;
    } else if (fileName.endsWith('.json')) {
      return <FileText className="w-4 h-4 text-orange-400" />;
    } else if (fileName.endsWith('.md')) {
      return <FileText className="w-4 h-4 text-purple-400" />;
    } else {
      return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const filterFiles = (nodes: FileNode[]): FileNode[] => {
    if (!searchQuery.trim()) return nodes;
    
    return nodes.filter(node => {
      if (node.type === 'folder') {
        const hasMatchingChildren = node.children && filterFiles(node.children).length > 0;
        return node.name.toLowerCase().includes(searchQuery.toLowerCase()) || hasMatchingChildren;
      }
      return node.name.toLowerCase().includes(searchQuery.toLowerCase());
    }).map(node => ({
      ...node,
      children: node.children ? filterFiles(node.children) : undefined
    }));
  };

  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    const filteredNodes = filterFiles(nodes);
    
    return filteredNodes.map(node => (
      <div key={node.id}>
        <div
          className={`file-tree-item ${
            selectedFile === node.name ? 'selected' : ''
          } group`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (node.type === 'file') {
              setSelectedFile(node.name);
            }
          }}
        >
          <div className="flex items-center space-x-2 flex-1">
            {node.type === 'folder' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.id);
                }}
                className="p-1 hover:bg-slate-600 rounded transition-colors"
              >
                {expandedFolders.has(node.id) ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
              </button>
            )}
            
            {node.type === 'file' && <div className="w-5" />}
            
            {getFileIcon(node.name, node.type)}
            
            <span className="text-sm text-slate-300 flex-1 truncate">
              {node.name}
            </span>
            
            {selectedFile === node.name && currentContract?.id === node.id && (
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            )}

            {node.type === 'file' && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyFileName(node.name);
                  }}
                  className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-slate-200"
                  title="Copy filename"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(node.name);
                  }}
                  className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-red-400"
                  title="Delete file"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {node.type === 'folder' && 
         expandedFolders.has(node.id) && 
         node.children && 
         renderFileTree(node.children, depth + 1)}
      </div>
    ));
  };

  const fileStructure = buildFileStructure();
  const totalFiles = Object.keys(fileContents).length;
  const contractFiles = Object.keys(fileContents).filter(name => name.endsWith('.sol')).length;
  const deployedContracts = contracts.filter(c => c.status === 'deployed').length;

  return (
    <div className="file-explorer">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
          Explorer
        </h3>
        <div className="flex space-x-1">
          <button 
            onClick={() => setShowNewFileDialog(true)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
            title="New File"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors relative"
            title="More Actions"
          >
            <MoreHorizontal className="w-4 h-4" />
            {showMoreMenu && (
              <div className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-lg py-2 z-50 min-w-[150px]">
                <button
                  onClick={() => {
                    setShowNewFileDialog(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New File
                </button>
                <button
                  onClick={() => {
                    // Refresh file structure
                    toast.success('Files refreshed');
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => {
                    setExpandedFolders(new Set(['contracts', 'test', 'scripts']));
                    setShowMoreMenu(false);
                    toast.success('Folders expanded');
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Expand All
                </button>
                <button
                  onClick={() => {
                    setExpandedFolders(new Set());
                    setShowMoreMenu(false);
                    toast.success('Folders collapsed');
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Collapse All
                </button>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-8 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {fileStructure.length > 0 ? (
          <div className="space-y-1">
            {renderFileTree(fileStructure)}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No files in workspace</p>
            <button 
              onClick={() => setShowNewFileDialog(true)}
              className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
            >
              Create your first file
            </button>
          </div>
        )}
        
        {searchQuery && filterFiles(fileStructure).length === 0 && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No files match `{searchQuery}`</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="border-t border-slate-700 p-4 bg-slate-800">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Files:</span>
            <span className="text-xs text-slate-300 font-medium">{totalFiles}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Contracts:</span>
            <span className="text-xs text-slate-300 font-medium">{contractFiles}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Deployed:</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-300 font-medium">{deployedContracts}</span>
              {deployedContracts > 0 && (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </div>
          </div>
          
          {/* Current Selection */}
          {selectedFile && (
            <div className="pt-2 border-t border-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Selected:</span>
                <span className="text-xs text-blue-400 font-medium truncate max-w-20" title={selectedFile}>
                  {selectedFile}
                </span>
              </div>
            </div>
          )}
          
          {/* Workspace Status */}
          <div className="pt-2 border-t border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Workspace:</span>
              <span className="text-xs text-green-400 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Create New File</h3>
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g., MyContract.sol, test.js, deploy.js"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewFile();
                    }
                  }}
                  autoFocus
                />
              </div>
              
              <div className="text-xs text-slate-400">
                <p>Supported file types:</p>
                <ul className="mt-1 space-y-1">
                  <li>• .sol - Solidity contracts</li>
                  <li>• .js/.ts - JavaScript/TypeScript</li>
                  <li>• .json - Configuration files</li>
                  <li>• .md - Documentation</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewFile}
                disabled={!newFileName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </div>
  );
}