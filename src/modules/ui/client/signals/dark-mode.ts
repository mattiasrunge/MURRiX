import { effect, signal } from '@preact/signals-react';
import { localStorageGet, localStorageSet } from '@ui/lib';

const KEY = 'dark-mode';

export const darkMode = signal<boolean>(localStorageGet(KEY));

export const toggleDarkMode = () => {
  darkMode.value = !darkMode.value;
};

effect(() => {
  localStorageSet(KEY, darkMode.value);

  if (document.firstElementChild) {
    document.firstElementChild.className = darkMode.value ? 'pf-v6-theme-dark' : '';
  }
});
