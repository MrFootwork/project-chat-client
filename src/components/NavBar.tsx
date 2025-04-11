import './NavBar.css';
import config from '../../config';

import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Group,
  MantineColorScheme,
  Modal,
  useMantineColorScheme,
} from '@mantine/core';

import { AuthContext } from '../contexts/AuthWrapper';
import { SocketContext } from '../contexts/SocketWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import { IconMoon, IconSun, IconSunMoon } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import axios from 'axios';
import { User } from '../types/user';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { selectedRoomID } = useContext(RoomsContext);

  const navigate = useNavigate();
  const location = useLocation();

  // FIXME User should be able to add friends

  /**********
   * AUTH
   *********/
  const isOnAuthPage = location.pathname.includes('/auth');

  async function authHandler() {
    if (user) logout();
    if (!user) navigate('/auth');
  }

  /******************
   * Theme Handling
   ******************/
  const { setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });

  const [currentTheme, setCurrentTheme] = useState<MantineColorScheme>('auto');

  // Set Mantine's color scheme whenever currentTheme changes
  useEffect(() => {
    setColorScheme(currentTheme);
  }, [currentTheme, setColorScheme]);

  // Cycles themes through auto, dark, and light
  function handleNextTheme() {
    setCurrentTheme(prevTheme => {
      const themes: MantineColorScheme[] = ['auto', 'dark', 'light'];
      const currentIndex = themes.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const nextTheme = themes[nextIndex];

      return nextTheme;
    });
  }

  /******************
   * Add Friend
   ******************/
  async function handleAddFriend() {
    console.log('Add friend clicked');
  }

  // Add member modal
  const [
    wantToAddFriend,
    { open: openModalAddFriend, close: closeModalAddFriend },
  ] = useDisclosure(false);

  const { token } = useContext(AuthContext);

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

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIDs, setSelectedUserIDs] = useState<User['id'][]>([]);

  // Initialize users
  useEffect(() => {
    if (!token) return;

    getAllUsers()
      .then(users => {
        setUsers(users);
        setSelectedUserIDs(users.map(user => user.id));
      })
      .catch(error => {
        console.error('Error fetching users:', error);
      });
  }, [token]);

  return (
    <nav className='navbar-container'>
      <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        Messenger
      </h1>

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

        <button onClick={openModalAddFriend} title='Add a friend'>
          add friend
        </button>

        {isOnAuthPage ? (
          ''
        ) : (
          <Button type='submit' onClick={authHandler}>
            {user ? 'Logout' : 'Login'}
          </Button>
        )}
      </div>

      {/* Add friend Modal */}
      {wantToAddFriend ? (
        <Modal
          opened={wantToAddFriend}
          onClose={closeModalAddFriend}
          title={`Add a friend`}
          yOffset='10rem'
          className='modal-add-friend'
        >
          <div className='button-container'>
            {/* BUG Redesign MultiSelect to be reusable */}
            <SearchableMultiSelect
              selectionList={selectedUserIDs}
              setSelectionList={setSelectedUserIDs}
              optionsList={[...users]}
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
