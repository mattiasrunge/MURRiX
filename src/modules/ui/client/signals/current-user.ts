import { signal } from '@preact/signals-react';
import { apiUser, UserAttrs } from '~/src/modules/user/mod.ts';
import { SocketEventSessionUpdated, SocketEventType } from '~/src/modules/ui/events.ts';
import { ctx, socket } from '@ui/lib';
import { NamedNodeData } from '~/src/modules/node/types.ts';

export const currentUser = signal<NamedNodeData<UserAttrs>>(null);

socket.subscribe(SocketEventType.SocketEventTypeSessionUpdated, async (event: SocketEventSessionUpdated) => {
  const access = event.payload;

  if (currentUser.value && currentUser.value.attrs.uid === access.uid) {
    return;
  }

  currentUser.value = await apiUser.whoami(ctx, {});
});

socket.onReady(async () => {
  currentUser.value = await apiUser.whoami(ctx, {});
});
