import { Database, Document, MongoClient } from 'mongo';
import { DBConfig } from './types.ts';

export class DB {
  private client: MongoClient;
  private db: Database;

  private constructor(client: MongoClient, db: Database) {
    this.client = client;
    this.db = db;
  }

  static async create(config: DBConfig) {
    const client = new MongoClient();
    const db = await client.connect(config);

    return new DB(client, db);
  }

  collection<T extends Document>(name: string) {
    return this.db.collection<T>(name);
  }

  dropDatabase() {
    return this.db.dropDatabase();
  }

  async destroy() {
    this.client.close();
  }
}
