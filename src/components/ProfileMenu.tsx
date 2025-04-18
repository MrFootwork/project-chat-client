import './ProfileMenu.css';

import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLogout } from '@tabler/icons-react';

import { AuthContext } from '../contexts/AuthWrapper';

type Props = {
  closeMenu: () => void;
};

const ProfileMenu = ({ closeMenu }: Props) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  async function authHandler() {
    if (user) logout();
    if (!user) navigate('/auth');
    closeMenu();
  }

  return (
    <div className='profile-menu-container'>
      <div className='menu'>
        <h5>Settings</h5>

        {/* FIXME add Combobox for themes */}
        {/* FIXME add Combobox for preferred AI */}
        <button className='item' id='item-test' onClick={authHandler}>
          <IconLogout size={18} />
          <label htmlFor='item-test'>Test</label>
        </button>
        <button className='item' id='item-logout' onClick={authHandler}>
          <IconLogout size={18} />
          <label htmlFor='item-logout'>Logout</label>
        </button>
      </div>
    </div>
  );
};

export default ProfileMenu;
