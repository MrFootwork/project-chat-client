import { useState } from 'react';
import {
  CheckIcon,
  Combobox,
  Group,
  Pill,
  PillsInput,
  useCombobox,
} from '@mantine/core';
import TheAvatar from './TheAvatar';

import { MessageAuthor } from '../types/user';

type Props = {
  selectionList: string[];
  setSelectionList: React.Dispatch<React.SetStateAction<string[]>>;
  optionsList: MessageAuthor[];
};

export function SearchableMultiSelect({
  selectionList,
  setSelectionList,
  optionsList,
}: Props) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const [search, setSearch] = useState('');

  const handleValueSelect = (id: string) =>
    setSelectionList(l =>
      l.includes(id) ? l.filter(v => v !== id) : [...l, id]
    );

  const handleValueRemove = (id: string) =>
    setSelectionList(l => l.filter(v => v !== id));

  const values = selectionList.map(selectedID => (
    <Pill
      key={selectedID}
      withRemoveButton
      onRemove={() => handleValueRemove(selectedID)}
    >
      <span>{optionsList.find(f => f.id === selectedID)?.name}</span>
    </Pill>
  ));

  const options = optionsList
    .filter(user =>
      user.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    .map(user => (
      <Combobox.Option
        value={user.id}
        key={user.id}
        active={selectionList.includes(user.id)}
      >
        <Group gap='sm'>
          {selectionList.includes(user.id) ? <CheckIcon size={12} /> : null}
          <TheAvatar user={user} size={'xs'} />
          <span>{user.name}</span>
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
                    handleValueRemove(selectionList[selectionList.length - 1]);
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
