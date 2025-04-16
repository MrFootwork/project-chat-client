import './MessageCard.css';
import type { Message } from '../types/message';

import { useContext, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import TheAvatar from './TheAvatar';

import { AuthContext } from '../contexts/AuthWrapper';
import { CodeHighlight, InlineCodeHighlight } from '@mantine/code-highlight';

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
        components={{
          code({ className, children, ...props }) {
            const isBlock = !!className;
            const language = className?.replace('language-', '') || 'txt';
            const codeString = String(children).trim(); // Convert children to a string
            const { ref, ...restProps } = props;

            return isBlock ? (
              <CodeHighlight
                code={codeString}
                language={language}
                style={{
                  borderRadius: '5px',
                  width: 'fit-content',
                  maxWidth: '100%',
                  margin: '0 auto',
                }}
                {...restProps}
              />
            ) : (
              <InlineCodeHighlight
                code={codeString}
                language={language}
                style={{ borderRadius: '5px' }}
                {...restProps}
              />
            );
          },
        }}
      >
        {/* BUG Research how line breaks are set in the DB and render them correctly */}
        {currentMessage.content || ''}
        {/* {(currentMessage.content || '').replace(/(?<!\n)\n(?!\n)/g, '\n\n')}  */}
      </ReactMarkdown>
    </div>
  );
};

export default MessageCard;
