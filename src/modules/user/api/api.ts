import { createApi } from '~/src/shared/api/mod.ts';
import { ApiIf } from './if.ts';

export const apiUser = createApi<ApiIf>('user');
