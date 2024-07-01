import { Button, NodeSearchInput } from '@ui/components';

type Props = {};

export default function Page({}: Props) {
  return (
    <div>
      App page
      <div>
        <NodeSearchInput />
      </div>
      <Button
        variant='primary'
        to='./branch1/world'
      >
        goto world
      </Button>
      <Button
        variant='primary'
        to='./branch1/hello'
      >
        goto hello
      </Button>
      <Button
        variant='secondary'
        to='./branch1/test'
      >
        goto test
      </Button>
    </div>
  );
}
