import { assert, assertArrayIncludes, assertEquals } from '@std/testing/asserts.ts';
import { ADMIN_ACCESS, ADMIN_UID, CUSTODIANS_GID, getMode, MaskACL, USERS_GID, utils } from '~/blocks/nodefs/mod.ts';
import { Service } from '~/lib/service/service.ts';
import { AppNodeFS } from '~/app/nodefs/app-nodefs.ts';
import { AppVault } from '~/app/vault/app-vault.ts';
import { AppApi } from '~/app/api/app-api.ts';
import { node, people } from '../../mod.ts';
import { PersonAttrs } from '../types.ts';

Deno.test({
  name: 'api.people',
  fn: async (t) => {
    const config = {
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

    // Bringup

    const appNodeFS = await AppNodeFS.create(await Service.create('api.node.test.nodefs'), config);
    const appVault = await AppVault.create(await Service.create('api.node.test.vault'), config);
    const appApi = await AppApi.create(await Service.create('api.node.test.api'), config);

    // Test steps

    await t.step('should run init and check people directory', async () => {
      await node.init(appApi.api, {});
      await people.init(appApi.api, {});

      // Verify admin group
      const peopleDir = await appApi.nodefs.resolveOne(ADMIN_ACCESS, '/people');
      assertEquals(peopleDir.name, 'people');
      assertEquals(peopleDir.paths, ['/people']);
      assertEquals(peopleDir.type, 'd');
      assert(peopleDir.props.btime.timestamp > 0);
      assertEquals(peopleDir.props.btime.uid, ADMIN_UID);
      assert(peopleDir.props.ptime.timestamp > 0);
      assertEquals(peopleDir.props.ptime.uid, ADMIN_UID);
      assert(peopleDir.props.atime.timestamp > 0);
      assertEquals(peopleDir.props.atime.uid, ADMIN_UID);
      assertEquals(peopleDir.props.mode, 0o770);
      assertEquals(peopleDir.props.gid, USERS_GID);
      assertEquals(peopleDir.props.acl.length, 1);
      assertEquals(peopleDir.props.acl[0].mode, getMode('rwx', MaskACL));
      assertEquals(peopleDir.props.acl[0].gid, CUSTODIANS_GID);
    });

    await t.step('should make a person', async () => {
      const person = await people.makePerson(appApi.api, {
        access: ADMIN_ACCESS,
        name: 'Eve Love',
        fullname: 'Eve Love',
        birthname: 'Eve Non-Love',
        description: 'Eve is nice',
        allergies: 'Eve has no allergies',
        gender: 'o',
        contact: [
          { type: 'email', data: 'eve@example.com' },
        ],
      });

      assertEquals(person.name, 'Eve_Love');
      assertEquals(person.attrs.fullname, 'Eve Love');
      assertEquals(person.attrs.birthname, 'Eve Non-Love');
      assertEquals(person.attrs.description, 'Eve is nice');
      assertEquals(person.attrs.allergies, 'Eve has no allergies');
      assertEquals(person.attrs.gender, 'o');
      assertEquals(person.attrs.contact![0], { type: 'email', data: 'eve@example.com' });

      assertEquals(await utils.exists(appApi.nodefs, ADMIN_ACCESS, `/people/${person.name}/children`), true);
      assertEquals(await utils.exists(appApi.nodefs, ADMIN_ACCESS, `/people/${person.name}/parents`), true);
      assertEquals(await utils.exists(appApi.nodefs, ADMIN_ACCESS, `/people/${person.name}/measurments`), true);
      assertEquals(await utils.exists(appApi.nodefs, ADMIN_ACCESS, `/people/${person.name}/texts`), true);
    });

    await t.step('should make a person with a family', async () => {
      const person = await people.makePerson(appApi.api, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      const mother = await people.makePerson(appApi.api, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      const father = await people.makePerson(appApi.api, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });

      await people.setMother(appApi.api, {
        access: ADMIN_ACCESS,
        childPath: person.paths![0],
        motherPath: mother.paths![0],
      });

      await people.setFather(appApi.api, {
        access: ADMIN_ACCESS,
        childPath: person.paths![0],
        fatherPath: father.paths![0],
      });

      const mother2 = await appApi.nodefs.resolveOne<PersonAttrs>(ADMIN_ACCESS, `/people/${person.name}/parents/mother`);
      assertEquals(mother2._id, mother._id);

      const father2 = await appApi.nodefs.resolveOne<PersonAttrs>(ADMIN_ACCESS, `/people/${person.name}/parents/father`);
      assertEquals(father2._id, father._id);

      const motherChildren = await appApi.nodefs.resolve<PersonAttrs>(ADMIN_ACCESS, `/people/${mother.name}/children/*`);
      assertEquals(motherChildren.length, 1);
      assertEquals(motherChildren[0]._id, person._id);

      const fatherChildren = await appApi.nodefs.resolve<PersonAttrs>(ADMIN_ACCESS, `/people/${father.name}/children/*`);
      assertEquals(fatherChildren.length, 1);
      assertEquals(fatherChildren[0]._id, person._id);

      const child1 = await people.makePerson(appApi.api, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });
      await people.setMother(appApi.api, {
        access: ADMIN_ACCESS,
        childPath: child1.paths![0],
        motherPath: person.paths![0],
      });

      const child2 = await people.makePerson(appApi.api, {
        access: ADMIN_ACCESS,
        name: crypto.randomUUID(),
      });
      await people.setFather(appApi.api, {
        access: ADMIN_ACCESS,
        childPath: child2.paths![0],
        fatherPath: person.paths![0],
      });

      const family = await people.getFamily(appApi.api, {
        access: ADMIN_ACCESS,
        path: person.paths![0],
      });

      assertEquals(family.person, person);
      assertEquals(family.mother!.person._id, mother._id);
      assertEquals(family.mother!.mother, null);
      assertEquals(family.mother!.father, null);
      assertEquals(family.father!.person._id, father._id);
      assertEquals(family.father!.mother, null);
      assertEquals(family.father!.father, null);
      assertEquals(family.children.length, 2);
      assertArrayIncludes([
        family.children[0].person._id,
        family.children[1].person._id,
      ], [
        child1._id,
        child2._id,
      ]);
      assertEquals(family.children[0].children.length, 0);
      assertEquals(family.children[1].children.length, 0);
    });

    await appNodeFS.db.dropDatabase();
    await appVault.db.dropDatabase();

    // Teardown

    for (const root of Object.values(config.fs.areas)) {
      await Deno.remove(root, { recursive: true });
    }

    await appApi.stop();
    await appVault.stop();
    await appNodeFS.stop();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});
