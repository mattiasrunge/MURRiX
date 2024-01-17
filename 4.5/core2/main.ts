import { Common, Config } from '~/layers/0_common/mod.ts';
import { Physical } from '~/layers/1_physical/mod.ts';
import { ADMIN_ACCESS, NodeFS, NodeRoot } from '~/lib/nodefs/mod.ts';

const config: Config = {
  fs: {
    areas: {
      'temp': await Deno.makeTempDir(),
    },
  },
  sm: {
    hostname: 'localhost',
    port: 6379,
  },
  db: {
    db: crypto.randomUUID(),
    servers: [
      {
        host: 'localhost',
        port: 27017,
      },
    ],
  },
  mq: {
    hostname: 'localhost',
    port: 5672,
  },
};

const start = async () => {
  const common = await Common.create(config);
  const phy = await Physical.create(common);
  const nodefs = await NodeFS.create(phy);
  console.log('running');

  const rootNode = new NodeRoot(nodefs, crypto.randomUUID());
  await rootNode.initialize(ADMIN_ACCESS);
  await rootNode.persist(ADMIN_ACCESS);
  console.log(rootNode.id);
  await rootNode.share();
  console.log('1', await rootNode.data());
  console.log('root created');

  const rootNodeCopy = new NodeRoot(nodefs, rootNode.id);
  await rootNodeCopy.loadShared();
  console.log('2', await rootNode.data());
};

start();
