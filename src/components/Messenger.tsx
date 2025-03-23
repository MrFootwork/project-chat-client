import { Button, Textarea } from '@mantine/core';
import { Room } from '../types/room';
import './Messenger.css';
import { useForm } from '@mantine/form';
import { KeyboardEvent } from 'react';

type Props = {
  room: Room | null;
};

const Messenger = (props: Props) => {
  const form = useForm({
    mode: 'controlled',
    initialValues: { text: (value: string) => value || null },
  });

  function sendText(values: typeof form.values) {
    console.log('text sent', values);
    form.reset();
  }

  function handleEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent line break
      form.onSubmit(sendText)(); // Trigger form submission
    }
  }

  return (
    <div className='messenger-container'>
      <div className='messages-display'>
        <p>Here are the messages.</p>
        {props.room ? <>{props.room.name}</> : 'Choose a room!'}
      </div>

      <div className='input-container'>
        <form onSubmit={form.onSubmit(sendText)}>
          <Textarea
            radius='md'
            placeholder='Enter your message here.'
            key={form.key('text')}
            {...form.getInputProps('text')}
            className='textarea-custom'
            onKeyDown={e => handleEnter(e)}
          />
          <Button type='submit'>Send</Button>
        </form>
      </div>
    </div>
  );
};

export default Messenger;
