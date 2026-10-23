import React from 'react'
import MarkdownEditor from '@uiw/react-markdown-editor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from 'next-themes'

interface MDXEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
  // The editor's own side-by-side preview. Narrow containers (like the node inspector) render
  // their own Write/Preview tabs instead, since a split pane there leaves both halves unusable.
  showPreview?: boolean
  autoFocus?: boolean
}

interface PreviewProps {
  content: string
}

const MDXEditor = React.forwardRef<HTMLDivElement, MDXEditorProps>(
  ({ value, onChange, placeholder, height = "200px", showPreview = true, autoFocus = false }, ref) => {
    const { resolvedTheme } = useTheme()
    const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light'
    return (
      <div ref={ref} data-color-mode={colorMode} className="w-full border rounded-md overflow-hidden">
        <MarkdownEditor
          value={value}
          onChange={(value) => onChange(value)}
          placeholder={placeholder}
          visible={showPreview}
          enablePreview={showPreview}
          height={height}
          theme={colorMode}
          autoFocus={autoFocus}
        />
      </div>
    )
  }
)

MDXEditor.displayName = 'MDXEditor'

// Tailwind's typography plugin isn't installed, so `prose` does nothing here - rendered
// markdown is styled by the .md-content rules in globals.css instead.
const MarkdownContent: React.FC<PreviewProps & { className?: string }> = ({ content, className = '' }) => {
  return (
    <div className={`md-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}

export { MDXEditor, MarkdownContent }
export type { MDXEditorProps }
