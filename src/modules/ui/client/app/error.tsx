import { useRouteError } from 'react-router-dom';
import { EmptyState, EmptyStateActions, EmptyStateBody, EmptyStateFooter, EmptyStateStatus, EmptyStateVariant } from '@patternfly/react-core';
import { Button } from '@ui/components';

export default function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  const title = error.status === 404 ? 'Page not found' : 'An error occurred';
  const body = error.data;

  return (
    <EmptyState
      status={EmptyStateStatus.danger}
      variant={EmptyStateVariant.xl}
      titleText={title}
      headingLevel='h4'
    >
      <EmptyStateBody>
        {body}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant='primary' to='/'>
            Back home
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
}
