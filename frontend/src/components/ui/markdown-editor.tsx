import React from 'react'
import MarkdownEditor from '@uiw/react-markdown-editor'
import ReactMarkdown from 'react-markdown'

interface MDXEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

interface PreviewProps {
  content: string
}

const MDXEditor = React.forwardRef<HTMLDivElement, MDXEditorProps>(
  ({ value, onChange, placeholder }, ref) => {
    return (
      <div ref={ref} className="w-full min-h-[200px] border rounded-md">
        <MarkdownEditor
          value={value}
          onChange={(value) => onChange(value)}
          placeholder={placeholder}
          visible={true}
          height="200px"
        />
      </div>
    )
  }
)

MDXEditor.displayName = 'MDXEditor'

const Preview: React.FC<PreviewProps> = ({ content }) => {
  return (
    <div className="prose dark:prose-invert max-w-none p-4">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

export { MDXEditor }
export type { MDXEditorProps }

MDXEditor.Preview = Preview