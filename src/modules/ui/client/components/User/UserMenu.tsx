import { useState } from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { currentUser } from '@ui/signals';
import { useSignals } from '@preact/signals-react/runtime';
import { apiUser } from '~/src/modules/user/mod.ts';
import { ctx } from '@ui/lib';

export function UserMenu() {
  useSignals();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const onDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const onDropdownSelect = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const onLogoutHandler = async () => {
    try {
      await apiUser.logout(ctx, {});
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dropdown
      isOpen={isDropdownOpen}
      onSelect={onDropdownSelect}
      onOpenChange={(isOpen: boolean) => setIsDropdownOpen(isOpen)}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onDropdownToggle}
          isExpanded={isDropdownOpen}
          // icon={<Avatar src={imgAvatar} size='sm' alt='' />}
        >
          {currentUser.value?.attrs.title || currentUser.value?.name || 'Unknown'}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem>My profile</DropdownItem>
        <DropdownItem>User management</DropdownItem>
        <DropdownItem
          onClick={onLogoutHandler}
        >
          Logout
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
