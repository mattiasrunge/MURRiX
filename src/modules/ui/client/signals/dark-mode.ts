import { effect, signal } from '@preact/signals-react';
import { localStorageGet, localStorageSet } from '@ui/lib';

const KEY = 'dark-mode';

export const darkModeSignal = signal(localStorageGet(KEY));

export const toggleDarkMode = () => {
  darkModeSignal.value = !darkModeSignal.value;
};

effect(() => {
  localStorageSet(KEY, darkModeSignal.value);

  if (document.firstElementChild) {
    document.firstElementChild.className = darkModeSignal.value ? 'pf-v6-theme-dark' : '';
  }
});
