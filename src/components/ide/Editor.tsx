'use client'

import { useEffect, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'

interface EditorProps {
  value: string
  language: string
  onChange: (value: string) => void
  onSave?: () => void
}

export function Editor({ value, language, onChange, onSave }: EditorProps) {
  const editorRef = useRef<any>(null)

  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }
    }

    window.addEventListener('keydown', handleSave)
    return () => window.removeEventListener('keydown', handleSave)
  }, [onSave])

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      onChange={(val) => onChange(val || '')}
      onMount={(editor) => {
        editorRef.current = editor
      }}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on'
      }}
    />
  )
}
