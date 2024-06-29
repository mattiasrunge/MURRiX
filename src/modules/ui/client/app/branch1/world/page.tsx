import { useLoaderData } from 'react-router-dom';
import { Button } from '@ui/components';

type Props = {};

export default function Page({}: Props) {
  const str = useLoaderData();
  console.log('str', str);
  return (
    <div>
      World page: {str}
      <Button
        variant='primary'
        to='../hello'
      >
        goto hello
      </Button>
      <Button
        variant='primary'
        to='/'
      >
        goto root
      </Button>
    </div>
  );
}
