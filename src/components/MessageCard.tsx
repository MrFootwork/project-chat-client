import './MessageCard.css';
import type { Message } from '../types/message';

import { useContext, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { CodeHighlight, InlineCodeHighlight } from '@mantine/code-highlight';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import TheAvatar from './TheAvatar';

import { AuthContext } from '../contexts/AuthWrapper';

interface MessageCardProps {
  messages: {
    pre?: Message;
    this: Message;
    next?: Message;
  };
  baseColor: React.CSSProperties['backgroundColor'];
  authorLabelColor: React.CSSProperties['color'];
}

const MessageCard: React.FC<MessageCardProps> = ({
  messages,
  baseColor,
  authorLabelColor,
}) => {
  const {
    pre: previousMessage,
    this: currentMessage,
    next: nextMessage,
  } = messages;

  const { user } = useContext(AuthContext);

  const itsMe = useRef(user?.id === currentMessage.author.id);
  const isFirst = useRef(
    !previousMessage || previousMessage.author.id !== currentMessage.author.id
  );
  const isLast = useRef(
    !nextMessage || nextMessage.author.id !== currentMessage.author.id
  );

  // Code renderer
  const renderCode = ({
    className,
    children,
    ...props
  }: {
    className?: string; // class="language-python", inline code don't have classes
    children?: React.ReactNode; // The message content passed to ReactMarkdown
    [key: string]: any;
  }) => {
    const isCodeBlock = !!className;
    const language = className?.replace('language-', '') || 'txt';
    const codeString = String(children).trim();

    return isCodeBlock ? (
      <CodeHighlight
        code={codeString}
        language={language}
        style={{ borderRadius: '5px' }}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      />
    ) : (
      <InlineCodeHighlight
        code={codeString}
        language={language}
        style={{ borderRadius: '5px' }}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  };

  return (
    <div
      className={`message-card 
        ${itsMe.current ? ' its-me' : ''} 
        ${isFirst.current ? 'first' : ''}
        ${isLast.current ? 'last' : ''}`}
      style={{ backgroundColor: baseColor }}
    >
      {isFirst.current && (
        <>
          <div className='image-container'>
            <TheAvatar user={messages.this.author} />
          </div>

          <h5 style={{ color: authorLabelColor }}>
            {currentMessage.author.name}
          </h5>
        </>
      )}

      <ReactMarkdown components={{ code: renderCode }}>
        {currentMessage.content
          ? preprocessMarkdown(currentMessage.content)
          : ''}
      </ReactMarkdown>
    </div>
  );
};

export default MessageCard;

/**
 * Preprocesses Markdown content by replacing single line breaks with double line breaks
 * in non-code text nodes, ensuring proper paragraph formatting.
 *
 * @param {string} content - The raw Markdown content to preprocess.
 * @returns {string} - The transformed Markdown content.
 *
 * @example
 * const input = "Line 1\nLine 2\n\nParagraph";
 * const output = preprocessMarkdown(input);
 * // Output: "Line 1\n\nLine 2\n\nParagraph"
 */
const preprocessMarkdown = (content: string): string => {
  const processor = unified()
    // Parse the Markdown content into AST
    .use(remarkParse)
    .use(() => tree => {
      // Traverse the Markdown AST and modify non-code content
      const visit = (node: any) => {
        if (node.type === 'text') {
          // Apply the transformation only to text nodes
          node.value = node.value.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
        }
        if (node.children) {
          node.children.forEach(visit);
        }
      };
      visit(tree);
    })
    .use(remarkStringify);

  return processor.processSync(content).toString();
};
