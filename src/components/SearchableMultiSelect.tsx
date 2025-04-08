import { useContext, useMemo, useState } from 'react';
import {
  CheckIcon,
  Combobox,
  Group,
  Pill,
  PillsInput,
  useCombobox,
} from '@mantine/core';
import TheAvatar from './TheAvatar';

import { AuthContext } from '../contexts/AuthWrapper';

type Props = {
  list: string[];
  setList: React.Dispatch<React.SetStateAction<string[]>>;
};

export function SearchableMultiSelect({ list, setList }: Props) {
  const { user } = useContext(AuthContext);

  const friends = useMemo(() => user?.friends || [], [user?.friends]);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const [search, setSearch] = useState('');

  const handleValueSelect = (id: string) =>
    setList(l => (l.includes(id) ? l.filter(v => v !== id) : [...l, id]));

  const handleValueRemove = (id: string) =>
    setList(l => l.filter(v => v !== id));

  const values = list.map(selectedID => (
    <Pill
      key={selectedID}
      withRemoveButton
      onRemove={() => handleValueRemove(selectedID)}
    >
      <span>{friends.find(f => f.id === selectedID)?.name}</span>
    </Pill>
  ));

  const options = friends
    .filter(friend =>
      friend.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    .map(friend => (
      <Combobox.Option
        value={friend.id}
        key={friend.id}
        active={list.includes(friend.id)}
      >
        <Group gap='sm'>
          {list.includes(friend.id) ? <CheckIcon size={12} /> : null}
          <TheAvatar user={friend} size={'xs'} />
          <span>{friend.name}</span>
        </Group>
      </Combobox.Option>
    ));

  return (
    <Combobox store={combobox} onOptionSubmit={handleValueSelect}>
      <Combobox.DropdownTarget>
        <PillsInput
          onClick={() => combobox.openDropdown()}
          label='Invite your friends'
        >
          <Pill.Group>
            {values}

            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                value={search}
                placeholder='Search friends'
                onChange={event => {
                  combobox.updateSelectedOptionIndex();
                  setSearch(event.currentTarget.value);
                }}
                onKeyDown={event => {
                  if (event.key === 'Backspace' && search.length === 0) {
                    event.preventDefault();
                    handleValueRemove(list[list.length - 1]);
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.length > 0 ? (
            options
          ) : (
            <Combobox.Empty>Nothing found...</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
