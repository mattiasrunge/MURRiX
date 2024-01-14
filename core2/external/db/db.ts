import { Database, MongoClient } from 'mongo';
import { Service } from '~/lib/service/mod.ts';
import { DBConfig } from './types.ts';

export class DB {
  private service: Service;
  private client: MongoClient;
  private db: Database;

  private constructor(service: Service, client: MongoClient, db: Database) {
    this.service = service;
    this.client = client;
    this.db = db;
  }

  static async connect(service: Service, config: DBConfig) {
    const client = new MongoClient();
    const db = await client.connect(config);

    return new DB(service, client, db);
  }

  collection<T>(name: string) {
    return this.db.collection<T>(name);
  }

  dropDatabase() {
    return this.db.dropDatabase();
  }

  async close() {
    this.client.close();
  }
}
