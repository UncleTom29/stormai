'use client';

import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface CodePreviewProps {
  code: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  height?: string;
}


export function CodePreview({
  code,
  language = 'solidity',
  readOnly = true,
  onChange,
  height = '100%',
}: CodePreviewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Configure Solidity language support
    if (!monaco.languages.getLanguages().find(lang => lang.id === 'solidity')) {
      monaco.languages.register({ id: 'solidity' });
      
      monaco.languages.setMonarchTokensProvider('solidity', {
        tokenizer: {
          root: [
            [/\/\/.*$/, 'comment'],
            [/\/\*/, 'comment', '@comment'],
            [/pragma|contract|import|using|library|interface|function|modifier|event|struct|enum|mapping|address|uint256|uint|string|bool|bytes32|bytes|public|private|internal|external|view|pure|payable|override|virtual|abstract|constant|immutable/, 'keyword'],
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
            [/\d+/, 'number'],
            [/[{}()\[\]]/, '@brackets'],
            [/[<>!~?:&|+\-*\/\^%]+/, 'operator'],
          ],
          comment: [
            [/[^\/*]+/, 'comment'],
            [/\/\*/, 'comment', '@push'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
          ],
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape.invalid'],
            [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
          ],
        },
      });

      monaco.languages.setLanguageConfiguration('solidity', {
        comments: {
          lineComment: '//',
          blockComment: ['/*', '*/'],
        },
        brackets: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        surroundingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
      });
    }

    // Create editor
    const editor = monaco.editor.create(editorRef.current, {
      value: code,
      language,
      theme: 'vs-dark',
      readOnly,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
    });

    monacoEditorRef.current = editor;

    // Set up change listener
    if (onChange && !readOnly) {
      const disposable = editor.onDidChangeModelContent(() => {
        onChange(editor.getValue());
      });

      return () => {
        disposable.dispose();
        editor.dispose();
      };
    }

    return () => {
      editor.dispose();
    };
  }, []);

  // Update code when prop changes
  useEffect(() => {
    if (monacoEditorRef.current && code !== monacoEditorRef.current.getValue()) {
      monacoEditorRef.current.setValue(code);
    }
  }, [code]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg h-full overflow-hidden">
      <div className="bg-slate-700 px-4 py-2 border-b border-slate-600 flex items-center justify-between">
        <span className="text-sm text-slate-300">
          {language === 'solidity' ? 'contracts/Contract.sol' : 'file'}
        </span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
      <div 
        ref={editorRef}
        style={{ height: height === '100%' ? 'calc(100% - 41px)' : height }}
      />
    </div>
  );
}