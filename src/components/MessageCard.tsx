import './MessageCard.css';
import type { Message } from '../types/message';

import { useContext, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { CodeHighlight, InlineCodeHighlight } from '@mantine/code-highlight';
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

      <ReactMarkdown
        components={{ code: renderCode }}
        remarkPlugins={[remarkBreaks]}
      >
        {currentMessage.content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MessageCard;
