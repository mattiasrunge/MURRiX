import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { darkMode, toggleDarkMode } from '@ui/signals';
import { useSignals } from '@preact/signals-react/runtime';

export function DarkMode() {
  useSignals();

  return (
    <ToggleGroup>
      <ToggleGroupItem
        icon={<SunIcon />}
        aria-label='light'
        buttonId='light'
        isSelected={!darkMode.value}
        onChange={toggleDarkMode}
      />
      <ToggleGroupItem
        icon={<MoonIcon />}
        aria-label='dark'
        buttonId='dark'
        isSelected={darkMode.value}
        onChange={toggleDarkMode}
      />
    </ToggleGroup>
  );
}
