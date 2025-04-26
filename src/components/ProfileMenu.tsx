import './ProfileMenu.css';

import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Combobox, Input, InputBase, useCombobox } from '@mantine/core';
import { IconLogout, IconRobot, IconUserCog } from '@tabler/icons-react';

import { AuthContext } from '../contexts/AuthWrapper';
import { SocketContext } from '../contexts/SocketWrapper';
import { useModal } from '../contexts/ModalContext';

type Props = {
  closeMenu: () => void;
};

const ProfileMenu = ({ closeMenu }: Props) => {
  const { user, logout } = useContext(AuthContext);
  const { botModel, setBotModel } = useContext(SocketContext);
  const { openModal } = useModal();

  const navigate = useNavigate();

  async function authHandler() {
    if (user) logout();
    if (!user) navigate('/auth');
    closeMenu();
  }

  // Combobox for AI model selection
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const ComboBoxAIModel = () => {
    const models = ['deepseek', 'gpt', 'dall-e'];

    const options = models.map(item => (
      <Combobox.Option value={item} key={item}>
        {item}
      </Combobox.Option>
    ));

    return (
      <Combobox
        store={combobox}
        onOptionSubmit={val => {
          setBotModel(val);
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <InputBase
            component='button'
            type='button'
            pointer
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents='none'
            onClick={() => combobox.toggleDropdown()}
          >
            {botModel || <Input.Placeholder>Pick AI Model</Input.Placeholder>}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown style={{ zIndex: '500' }}>
          <Combobox.Options>{options}</Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    );
  };

  function handleProfileEdit() {
    openModal('profileEdit');
    closeMenu();
  }

  return (
    <div className='profile-menu-container'>
      <div className='menu'>
        <h5>Settings</h5>

        <button className='item' id='item-edit' onClick={handleProfileEdit}>
          <IconUserCog size={18} />
          <label htmlFor='item-edit'>Edit Profile</label>
        </button>

        <div className='item' id='item-bot'>
          <IconRobot size={18} />
          <label htmlFor='item-bot'>AI Model</label>
          {ComboBoxAIModel()}
        </div>

        <button className='item' id='item-logout' onClick={authHandler}>
          <IconLogout size={18} />
          <label htmlFor='item-logout'>Logout</label>
        </button>
      </div>
    </div>
  );
};

export default ProfileMenu;
