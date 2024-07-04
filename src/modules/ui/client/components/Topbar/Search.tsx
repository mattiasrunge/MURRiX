import React from 'react';
import { Button, MenuToggle, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities } from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';

export function Search() {
  const [inputValue, setInputValue] = React.useState<string>('');

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
  };

  return (
    <MenuToggle
      variant='typeahead'
      isFullWidth
      aria-label='Typeahead menu toggle'
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onChange={onTextInputChange}
          id='typeahead-select-input'
          autoComplete='off'
          placeholder='Search...'
        />

        <TextInputGroupUtilities>
          {!!inputValue && (
            <Button
              variant='plain'
              onClick={() => setInputValue('')}
              aria-label='Clear input value'
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );
}
