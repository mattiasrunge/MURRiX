import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  path: string;
};

export default function Layout({ children, path }: Props) {
  return (
    <div>
      <span>
        <strong>ABC:</strong>
        <strong>Layout:</strong>
        <br />
        {path}
      </span>
      {children}
    </div>
  );
}
