import { ReactNode } from 'react';
import { Topbar } from '@ui/components';
import { ctx, socket } from '@ui/lib';
import { apiUser } from '~/src/modules/user/mod.ts';

type Props = {
  children: ReactNode;
  path: string;
};

export default function Layout({ children }: Props) {
  return (
    <div>
      <div className='pf-v6-c-background-image' />
      <div className='page-topbar'>
        <Topbar />
      </div>
      <div className='page-content'>
        {children}
      </div>
    </div>
  );
}

addEventListener('DOMContentLoaded', async () => {
  await socket.connect();
});
