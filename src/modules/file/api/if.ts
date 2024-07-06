import { JSONValue } from '~/src/shared/types.ts';
import { FSVerifyResult } from '~/src/external/fs/types.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { NamedNodeData, NodePath } from '~/src/modules/node/types.ts';
import { FileAttrs } from '../types.ts';

export type ApiIf = {
  readFileMetadata(ctx: ApiContext, args: { nodePath: NodePath }): Promise<Record<string, JSONValue>>;
  regenerateFileMetadata(ctx: ApiContext, args: { nodePath: NodePath }): Promise<NamedNodeData<FileAttrs>>;
  verifyFile(ctx: ApiContext, args: { nodePath: NodePath }): Promise<FSVerifyResult>;
};
