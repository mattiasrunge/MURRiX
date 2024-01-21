import { join } from 'std/path/mod.ts';
import { assert } from 'std/assert/mod.ts';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { log } from '~/src/shared/log/mod.ts';
import { FileMeta, getAreaName, parseRawMetadata } from '../filefs/mod.ts';
import { FileAttrs } from '../types.ts';

type I = {
  access: Access;
  parentPath: NodePath;
  fileId: string;
  description?: string;
};

type O = NamedNodeData<FileAttrs>;

export const makeFile = api<I, O>(
  async (service: ServiceIf, { access, parentPath, fileId, description }) => {
    const areaName = getAreaName();
    const area = service.getFs().getArea(areaName);
    const section = await area.getSection(fileId);

    assert(section === 'staging', `Can only make file from a staged file. The given file id is in ${section}`);

    const info = await area.getInfo(fileId);
    let meta: FileMeta | undefined;

    try {
      const rawMeta = await area.getMetadata(fileId);
      meta = parseRawMetadata(info.mimetype, rawMeta);
    } catch (error) {
      log.error(`Failed to get and parse metadata for ${fileId}`, error);
    }

    const nodePath = join(parentPath, info.filename);

    await nodeApi.make(service, {
      access,
      path: nodePath,
      type: 'f',
      attrs: {
        title: info.filename,
        description: description || null,
        area: areaName,
        fileId,
        mimetype: info.mimetype,
        size: info.size,
        sha256: info.sha256,
        meta,
      } as FileAttrs,
    });

    try {
      await area.commit(fileId);
    } catch (error) {
      await nodeApi.remove(service, {
        access: ADMIN_ACCESS,
        path: nodePath,
      });

      throw error;
    }

    return await nodeApi.resolveOne(service, {
      access,
      path: nodePath,
    }) as O;
  },
);
