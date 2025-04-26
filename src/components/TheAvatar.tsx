import './TheAvatar.css';
import { Avatar, AvatarProps } from '@mantine/core';
import { MessageAuthor } from '../types/user';

type Props = {
  user: MessageAuthor;
  size?: AvatarProps['size'];
  children?: any;
} & Omit<AvatarProps, 'size' | 'src' | 'alt'>;

const TheAvatar = ({ user, size, children, ...rest }: Props) => {
  function userHasAvatar(url: string | null): url is string {
    return !!url && typeof url === 'string' && url !== '';
  }

  return (
    <div className='avatar-wrapper'>
      {userHasAvatar(user.avatarUrl) ? (
        <Avatar size={size} src={user.avatarUrl} alt={user.name} {...rest} />
      ) : (
        <Avatar
          src={null}
          size={size}
          name={user.name}
          alt={user.name}
          color='red'
          variant='filled'
          {...rest}
        />
      )}
      <div className='children'>{children}</div>
    </div>
  );
};

export default TheAvatar;
