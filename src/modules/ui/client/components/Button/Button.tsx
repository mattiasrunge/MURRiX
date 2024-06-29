import { Link } from 'react-router-dom';
import { Button as PButton, ButtonProps } from '@patternfly/react-core';

export function Button(props: ButtonProps) {
  return (
    <PButton
      {...props}
      component={(props: any) => <Link {...props} />}
    />
  );
}
