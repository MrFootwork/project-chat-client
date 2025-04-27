import './NavBar.css';
import { User } from '../types/user';
import config from '../../config';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Burger,
  Button,
  Group,
  MantineColorScheme,
  Modal,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconMoon,
  IconSun,
  IconSunMoon,
  IconUserSearch,
} from '@tabler/icons-react';

import ProfileMenu from './ProfileMenu';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import TheAvatar from './TheAvatar';

import { ThemeContext } from '../contexts/ThemeWrapper';
import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';
import { SocketContext } from '../contexts/SocketWrapper';

const NavBar = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { selectedRoomID } = useContext(RoomsContext);

  const navigate = useNavigate();
  const location = useLocation();

  /**********
   * Routing
   *********/
  const isOnHome = location.pathname === '/';

  /******************
   * Theme Handling
   ******************/
  const { setColorScheme, colorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });

  const [currentTheme, setCurrentTheme] =
    useState<MantineColorScheme>(colorScheme);

  // Cycles themes through auto, dark, and light
  function handleNextTheme() {
    setCurrentTheme(prevTheme => {
      const themes: MantineColorScheme[] = ['auto', 'dark', 'light'];
      const currentIndex = themes.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const nextTheme = themes[nextIndex];

      setColorScheme(nextTheme);

      return nextTheme;
    });
  }

  /************************
   * Burger Menu (mobile)
   ************************/
  const { isMobile, toggleButtonContainer, showButtonContainer } =
    useContext(ThemeContext);

  /******************
   * Profile Menu
   ******************/
  const meUser = useMemo(() => user || ({} as User), [user]);

  const [profileMenuOpened, setProfileMenuOpened] = useState(false);

  /******************
   * Add Friend
   ******************/
  // Add friend modal
  const [
    wantToAddFriend,
    { open: openModalAddFriend, close: closeModalAddFriend },
  ] = useDisclosure(false);

  async function getAllUsers() {
    try {
      const response = await axios.get<User[]>(`${config.API_URL}/api/users`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [] as User[];
    }
  }

  // FIXME User should be able to delete users from friends list
  async function handleAddFriend() {
    socket?.emit('add-friend', selectedUserIDs);
    closeModalAddFriend();
  }

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIDs, setSelectedUserIDs] = useState<User['id'][]>([]);

  // Initialize users
  useEffect(() => {
    if (!token || !user?.friends) return;

    getAllUsers()
      .then(allUsers => {
        const allOtherUsers = allUsers.filter(
          otherUser => otherUser.id !== user.id
        );

        const initialFriendIDs = allOtherUsers
          .map(user => user.id)
          .filter(userID => user?.friends.some(f => f.id === userID));

        setUsers(allOtherUsers);
        setSelectedUserIDs(initialFriendIDs);
      })
      .catch(error => {
        console.error('Error fetching friend IDs:', error);
      });
  }, [user?.friends, token]);

  return (
    <nav className='navbar-container'>
      {isMobile && !isOnHome ? (
        <Burger
          size={25}
          opened={showButtonContainer}
          onClick={toggleButtonContainer}
          aria-label='Toggle navigation'
        />
      ) : (
        <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          Messenger
        </h1>
      )}

      {config.ENV === 'development' ? (
        <p className='navbar-text'>
          Env: {config.API_URL} <br />
          User: "{user?.name}" {user?.id} <br />
          Socket: {socket?.id} <br />
          Room: {selectedRoomID}
        </p>
      ) : (
        ''
      )}

      <div className='button-container'>
        {user?.friends && (
          <button
            onClick={openModalAddFriend}
            title='Add a friend'
            className='icon-button'
          >
            <IconUserSearch />
          </button>
        )}

        <button
          className='button-theme-toggler icon-button'
          onClick={handleNextTheme}
          title='Cycle themes through auto, dark, and light'
        >
          {
            {
              auto: <IconSunMoon />,
              dark: <IconMoon />,
              light: <IconSun />,
            }[currentTheme]
          }
        </button>

        <button
          className='profile-settings'
          onClick={() => {
            if (user) setProfileMenuOpened(open => !open);
          }}
        >
          <TheAvatar user={meUser} />
        </button>

        {profileMenuOpened && (
          <>
            <div
              className='overlay'
              onClick={() => setProfileMenuOpened(false)}
            />
            <ProfileMenu closeMenu={() => setProfileMenuOpened(false)} />
          </>
        )}
      </div>

      {/* Add friend Modal */}
      {wantToAddFriend ? (
        <Modal
          opened={wantToAddFriend}
          onClose={closeModalAddFriend}
          title={`Add a user as friend`}
          yOffset='10rem'
          className='modal-add-friend'
        >
          <div className='button-container'>
            <SearchableMultiSelect
              selectionList={selectedUserIDs}
              setSelectionList={setSelectedUserIDs}
              optionsList={[...users]}
              optionTarget='user'
            />

            <Group justify='flex-end'>
              <Button onClick={closeModalAddFriend} variant='outline'>
                Cancel
              </Button>
              <Button onClick={handleAddFriend} variant='filled'>
                Add
              </Button>
            </Group>
          </div>
        </Modal>
      ) : (
        ''
      )}
    </nav>
  );
};

export default NavBar;
