'use client';

import { useEffect, useRef, useState } from 'react';

interface TerminalProps {
  output: string[];
  onCommand?: (command: string) => void;
  readOnly?: boolean;
  height?: string;
}

export function Terminal({ output, onCommand, readOnly = false, height = '100%' }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommand.trim()) return;

    // Add to history
    setCommandHistory(prev => [...prev, currentCommand.trim()]);
    setHistoryIndex(-1);

    // Execute command
    onCommand?.(currentCommand.trim());
    setCurrentCommand('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : commandHistory.length - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete commands
      const commonCommands = ['clear', 'ls', 'help', 'pwd', 'npm run compile', 'npm test', 'cat ', 'touch '];
      const matches = commonCommands.filter(cmd => cmd.startsWith(currentCommand));
      if (matches.length === 1) {
        setCurrentCommand(matches[0]);
      }
    }
  };

  const formatOutputLine = (line: string) => {
    // Color coding for different types of output
    if (line.includes('✅') || line.toLowerCase().includes('success')) {
      return { text: line, className: 'text-green-400' };
    } else if (line.includes('❌') || line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
      return { text: line, className: 'text-red-400' };
    } else if (line.includes('⚠️') || line.toLowerCase().includes('warning')) {
      return { text: line, className: 'text-yellow-400' };
    } else if (line.startsWith('$')) {
      return { text: line, className: 'text-blue-400 font-medium' };
    } else if (line.startsWith('[') && line.includes(']')) {
      return { text: line, className: 'text-cyan-400' };
    } else if (line.includes('🚀') || line.includes('💡') || line.includes('🔄')) {
      return { text: line, className: 'text-purple-400' };
    } else if (line.includes('📁') || line.includes('📄') || line.includes('🗂️')) {
      return { text: line, className: 'text-orange-400' };
    } else {
      return { text: line, className: 'text-slate-300' };
    }
  };

  return (
    <div 
      className="terminal-container bg-slate-900 text-slate-100 font-mono text-sm h-full flex flex-col"
      style={{ height }}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-xs text-slate-400 ml-2">Terminal</span>
        </div>
        <div className="text-xs text-slate-500">
          {readOnly ? 'Read Only' : 'Interactive'}
        </div>
      </div>

      {/* Output Area */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ minHeight: '200px' }}
      >
        {output.map((line, index) => {
          const formatted = formatOutputLine(line);
          return (
            <div key={index} className={`whitespace-pre-wrap break-words ${formatted.className}`}>
              {formatted.text}
            </div>
          );
        })}
        
        {/* Current input line (if not read-only) */}
        {!readOnly && (
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-blue-400 font-medium">$</span>
            <form onSubmit={handleSubmit} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-slate-100 flex-1 font-mono"
                placeholder="Enter command..."
                autoComplete="off"
                spellCheck={false}
              />
            </form>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-slate-800 px-4 py-1 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {output.length}</span>
          {commandHistory.length > 0 && (
            <span>History: {commandHistory.length}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <>
              <span>↑↓ History</span>
              <span>Tab Complete</span>
            </>
          )}
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Ready
          </span>
        </div>
      </div>
    </div>
  );
}