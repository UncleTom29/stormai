/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAccount } from 'wagmi';
import { useChat } from '@ai-sdk/react';
import { X, Send, Bot, User, Lightbulb, Code, Shield, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AIChatSidebar() {
  const { toggleChat, currentContract, addChatMessage } = useAppStore();
  const { address } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  
  const { 
    messages, 
    sendMessage, 
    status, 
    error 
  } = useChat({
    onFinish: (options) => {
      // Save to store
      if (options.message.parts && options.message.parts.length > 0) {
        const content = options.message.parts
          .filter(part => part.type === 'text')
          .map(part => part.text)
          .join('');
        
        addChatMessage({
          id: Date.now().toString(),
          message: inputValue,
          response: content,
          timestamp: new Date(),
          isUser: false,
        });
      }
    },
    onError: (error) => {
      toast.error('AI chat error');
      console.error('AI chat error:', error);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    {
      icon: Shield,
      text: 'Review security',
      prompt: 'Please review this contract for security vulnerabilities and suggest improvements.',
    },
    {
      icon: Zap,
      text: 'Optimize gas',
      prompt: 'How can I optimize this contract to reduce gas costs?',
    },
    {
      icon: Code,
      text: 'Explain code',
      prompt: 'Please explain what this contract does and how it works.',
    },
    {
      icon: Lightbulb,
      text: 'Suggest features',
      prompt: 'What additional features would you recommend for this contract?',
    },
  ];

  const handleQuickPrompt = (prompt: string) => {
    if (!isLoading) {
      setInputValue(prompt);
      sendMessage({
        text: prompt,
      }, {
        body: {
          userId: address,
          contractCode: currentContract?.sourceCode,
        }
      });
      setInputValue('');
    }
  };

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!inputValue.trim() || isLoading) return;

  const messageContent = inputValue.trim();
  setInputValue('');
  sendMessage({
    text: messageContent,
  }, {
    body: {
      userId: address,
      contractCode: currentContract?.sourceCode,
    }
  });
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Helper function to extract text content from message parts
  const getMessageContent = (message: any) => {
    if (message.parts) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    return message.content || '';
  };

  return (
    <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100">AI Assistant</h3>
          </div>
          <button
            onClick={toggleChat}
            className="text-slate-400 hover:text-slate-200 p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Get help with smart contract development
        </p>
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt.prompt)}
                className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 p-3 rounded-lg text-left transition-colors"
                disabled={isLoading}
              >
                <prompt.icon className="w-4 h-4 text-blue-400 mb-1" />
                <span className="text-xs text-slate-300">{prompt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-100 mb-2">
              Welcome to StormAI Assistant
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              I can help you with:
            </p>
            <ul className="text-xs text-slate-400 space-y-1 text-left max-w-48 mx-auto">
              <li>• Contract optimization</li>
              <li>• Security best practices</li>
              <li>• Gas optimization</li>
              <li>• Code explanations</li>
              <li>• Debugging assistance</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 chat-message ${
              message.role === 'user' ? 'justify-end flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' ? 'bg-slate-600' : 'bg-blue-600'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div
              className={`max-w-[280px] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">
                {getMessageContent(message)}
              </div>
              {message.role === 'assistant' && (
                <div className="text-xs text-slate-400 mt-2">
                  {new Date().toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
            <p className="text-red-200 text-sm">
              Error: {error.message}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask about your contract..."
            disabled={isLoading}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        
        <div className="text-xs text-slate-500 mt-2 text-center">
          AI responses may contain errors. Always verify code.
        </div>
      </div>
    </div>
  );
}