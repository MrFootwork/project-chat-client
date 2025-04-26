import './MessageCard.css';
import type { Message } from '../types/message';

import { useContext, useEffect, useRef, useState } from 'react';
import { Loader } from '@mantine/core';
import { CodeHighlight, InlineCodeHighlight } from '@mantine/code-highlight';
import { IconEdit, IconFileX } from '@tabler/icons-react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import TheAvatar from './TheAvatar';

import { AuthContext } from '../contexts/AuthWrapper';
import { SocketContext } from '../contexts/SocketWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

interface MessageCardProps {
  messages: {
    pre?: Message;
    this: Message;
    next?: Message;
  };
  baseColor: React.CSSProperties['backgroundColor'];
  authorLabelColor: React.CSSProperties['color'];
  onEdit?: (message: Message) => void;
}

const MessageCard: React.FC<MessageCardProps> = ({
  messages,
  baseColor,
  authorLabelColor,
  onEdit,
}) => {
  const {
    pre: previousMessage,
    this: currentMessage,
    next: nextMessage,
  } = messages;

  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { currentRoom } = useContext(RoomsContext);

  const userIsAdmin = useRef(
    currentRoom?.members.find(m => m.id === user?.id)!.isAdmin
  );

  const userIsAuthor = useRef(user?.id === currentMessage.author.id);

  const isFirst = useRef(
    !previousMessage || previousMessage.author.id !== currentMessage.author.id
  );
  const isLast = useRef(
    !nextMessage || nextMessage.author.id !== currentMessage.author.id
  );

  const botIsThinking =
    currentMessage.author.id === 'chat-bot' && !currentMessage.content;

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

  // Table Renderer
  const renderTable: Components['table'] = ({ node, ...props }) => (
    <div className='table-container'>
      <table {...props}></table>
    </div>
  );

  // Image Renderer
  const renderImage: Components['img'] = ({ node, ...props }) => (
    <span className='image-wrapper'>
      <img {...props}></img>
    </span>
  );

  // Message Options
  const handleMessageDelete = () => {
    socket?.emit('delete-message', currentMessage.id);
  };

  const handleMessageEdit = () => {
    if (onEdit) onEdit(currentMessage);
  };

  // Generate descriptive date
  const [descriptiveDate, setDescriptiveDate] = useState(() => {
    const date = new Date(currentMessage.updatedAt);
    return calculateDescriptiveDate(date);
  });

  useEffect(() => {
    const updateDescriptiveDate = () => {
      const date = new Date(currentMessage.updatedAt);
      setDescriptiveDate(calculateDescriptiveDate(date));
    };

    // Run immediately on the first render
    updateDescriptiveDate();

    // Determine interval duration
    const now = new Date();
    const date = new Date(currentMessage.updatedAt);

    const timeDifferenceInMs = now.getTime() - date.getTime();
    let intervalDuration;

    switch (true) {
      // Within 1 hour check each minute
      case timeDifferenceInMs < 1000 * 60 * 60:
        intervalDuration = 1000 * 60;
        break;
      // Within 1 day check each hour
      case timeDifferenceInMs < 1000 * 60 * 60 * 24:
        intervalDuration = 1000 * 60 * 60;
        break;

      default:
        break;
    }

    let interval = null;

    if (intervalDuration) {
      interval = setInterval(updateDescriptiveDate, 60000);
    }

    return () => {
      interval && clearInterval(interval);
    };
  }, [currentMessage.updatedAt]);

  function calculateDescriptiveDate(date: Date) {
    const now = new Date();

    const timeDifferenceInMs = now.getTime() - date.getTime();
    const timeDifferenceInMinutes = Math.floor(
      timeDifferenceInMs / (1000 * 60)
    );
    const timeDifferenceInHours = Math.floor(timeDifferenceInMinutes / 60);

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (timeDifferenceInMinutes < 1) {
      return `just now`;
    }

    if (timeDifferenceInMinutes < 60) {
      return `${timeDifferenceInMinutes} minutes ago`;
    }

    if (timeDifferenceInHours < 24) {
      return `${timeDifferenceInHours} hours ago`;
    }

    const isYesterday =
      now.getDate() - date.getDate() === 1 &&
      now.getMonth() === date.getMonth() &&
      now.getFullYear() === date.getFullYear();

    if (isYesterday) {
      return `yesterday at ${timeFormatter.format(date)}`;
    }

    return date.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  return (
    <div
      className={`message-card 
        ${userIsAuthor.current ? ' its-me' : ''} 
        ${isFirst.current ? 'first' : ''}
        ${isLast.current ? 'last' : ''}`}
      style={{ backgroundColor: baseColor }}
    >
      {isFirst.current && (
        <>
          <div className='image-container'>
            <TheAvatar user={messages.this.author} size={'2.8rem'} />
          </div>

          <h5 className='username-label' style={{ color: authorLabelColor }}>
            {currentMessage.author.name}
          </h5>
        </>
      )}

      {botIsThinking && <Loader type='dots' color={authorLabelColor} />}

      {currentMessage.deleted ? (
        'Message deleted'
      ) : (
        <ReactMarkdown
          components={{
            code: renderCode,
            table: renderTable,
            img: renderImage,
          }}
          remarkPlugins={[remarkBreaks, remarkGfm]}
        >
          {currentMessage.content || ''}
        </ReactMarkdown>
      )}

      {currentMessage.edited && (
        <div className='edited-label'>{`edited ${descriptiveDate}`}</div>
      )}

      <div className='options'>
        <button
          className='icon-button'
          onClick={handleMessageEdit}
          disabled={!(userIsAdmin.current || userIsAuthor.current)}
        >
          <IconEdit size={20} />
        </button>
        <button
          className='icon-button'
          onClick={handleMessageDelete}
          disabled={!(userIsAdmin.current || userIsAuthor.current)}
        >
          <IconFileX size={20} />
        </button>
      </div>
    </div>
  );
};

export default MessageCard;
