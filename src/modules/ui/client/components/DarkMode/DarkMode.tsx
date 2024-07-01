import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { darkModeSignal, toggleDarkMode } from '@ui/signals';

export function DarkMode() {
  return (
    <ToggleGroup>
      <ToggleGroupItem
        icon={<SunIcon />}
        aria-label='light'
        buttonId='light'
        isSelected={!darkModeSignal.value}
        onChange={toggleDarkMode}
      />
      <ToggleGroupItem
        icon={<MoonIcon />}
        aria-label='dark'
        buttonId='dark'
        isSelected={darkModeSignal.value}
        onChange={toggleDarkMode}
      />
    </ToggleGroup>
  );
}
