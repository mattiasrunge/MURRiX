import { Button } from '@ui/components';

type Props = {};

export default function Page({}: Props) {
  return (
    <div>
      Hello page
      <Button
        variant='primary'
        to='../world'
      >
        goto world
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
