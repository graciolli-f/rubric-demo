 'use client';

interface Props {
  code: string;
  language?: string;
}

export default function CodeExample({ code, language = 'javascript' }: Props) {
  const highlightedCode = code
    .replace(/\/\/.*/g, '<span class="comment">$&</span>')
    .replace(/(import|export|from|const|function|return)/g, '<span class="keyword">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="string">$1</span>')
    .replace(/(withRubric|useRubricValidation|validateComponent)/g, '<span class="function">$1</span>');

  return (
    <div className="relative">
      <pre className="code-block">
        <code 
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
      
      <button
        onClick={() => navigator.clipboard.writeText(code)}
        className="absolute top-2 right-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded transition-colors"
        aria-label="Copy code"
      >
        Copy
      </button>
    </div>
  );
}