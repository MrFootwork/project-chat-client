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
import { notifications } from '@mantine/notifications';
import {
  IconBellFilled,
  IconBellRingingFilled,
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
  const isOnAuth = location.pathname === '/auth';

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

  // Subscribe to push notifications
  async function handleSubscribe() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('PERMISSION: ', Notification.permission);

      if (Notification.permission === 'default') {
        // Request permission when the user clicks the button
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Retry subscription logic here
          handleSubscribe();
        } else {
          console.error('Notification permission denied.');
        }
      } else if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.pushManager
            .subscribe({
              userVisibleOnly: true,
              applicationServerKey: config.VAPID_PUBLIC_KEY,
            })
            .then(async subscription => {
              try {
                const authHeader = {
                  Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
                };

                const { data, status } = await axios.post(
                  `${config.API_URL}/api/messages/subscribe`,
                  subscription,
                  { headers: authHeader }
                );

                if (status === 201)
                  notifications.show({
                    title: data.message,
                    message: 'You will receive push notifications from now on.',
                    color: 'green',
                  });
              } catch (error) {
                throw error;
              }
            })
            .catch(error => {
              console.error('Push subscription failed:', error);
            });

          registration.pushManager.getSubscription().then(subscription => {
            console.log('Push Subscription:', subscription);
          });
        });
      } else {
        console.error('Notification permission denied.');
        // FIXME Provide info for user how to allow notifications
      }
    } else {
      console.error('Push notifications are not supported in this browser.');
    }
  }
  // Notify all subscribers
  async function handleNotify() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async registration => {
        try {
          // Check if the user is already subscribed
          const existingSubscription =
            await registration.pushManager.getSubscription();

          if (existingSubscription) {
            // Send the subscription data to the server
            const authHeader = {
              Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
            };

            const { data, status } = await axios.post(
              `${config.API_URL}/api/messages/notify`,
              { subscription: existingSubscription },
              { headers: authHeader }
            );

            if (status === 200) {
              notifications.show({
                title: 'Notification Sent',
                message: data.message,
                color: 'green',
              });
            }
          } else {
            console.error('No existing subscription found.');
            notifications.show({
              title: 'Error',
              message: 'You are not subscribed to notifications.',
              color: 'red',
            });
          }
        } catch (error) {
          console.error('Error handling notification:', error);
        }
      });
    } else {
      console.error('Push notifications are not supported in this browser.');
    }
  }

  return (
    <nav className='navbar-container'>
      {isMobile && !isOnHome && !isOnAuth ? (
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
        <button className='button-push icon-button' onClick={handleNotify}>
          <IconBellRingingFilled />
        </button>

        <button className='button-push icon-button' onClick={handleSubscribe}>
          <IconBellFilled />
        </button>

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
