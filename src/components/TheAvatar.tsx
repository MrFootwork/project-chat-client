import { Avatar, AvatarProps } from '@mantine/core';
import { MessageAuthor } from '../types/user';

type Props = {
  user: MessageAuthor;
  size?: AvatarProps['size'];
};

const TheAvatar = ({ user, size }: Props) => {
  function userHasAvatar(url: string | null): url is string {
    return !!url && typeof url === 'string' && url !== '';
  }

  return (
    <>
      {userHasAvatar(user.avatarUrl) ? (
        <Avatar size={size} src={user.avatarUrl} alt={user.name} />
      ) : (
        <Avatar
          src={null}
          size={size}
          name={user.name}
          alt={user.name}
          color='red'
          variant='filled'
        />
      )}
    </>
  );
};

export default TheAvatar;
