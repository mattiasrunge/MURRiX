import { ReactNode } from 'react';
import { Topbar } from '@ui/components';

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

addEventListener('DOMContentLoaded', () => {
  const ws = new WebSocket('/ws');
  ws.onopen = () => console.log('Connected to server');
  ws.onmessage = (m) => {
    console.log('Got message from server: ', m.data);
    ws.send(`Some message ${crypto.randomUUID()}`);
  };
  ws.onclose = () => console.log('Disconnected from server');
});
