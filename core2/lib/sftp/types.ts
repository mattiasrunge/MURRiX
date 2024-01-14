import { Attributes as SshAttributes, AuthContext, Connection as SshConnection, FileEntry as SshFileEntry, Session as SshSession } from 'ssh2';
import { Connection } from './connection.ts';

export type Session = Record<string, unknown>;

export type Client = {
  sshConnection: SshConnection;
  session: Session;
};

export type AuthRequest = AuthContext;
export type Attributes = SshAttributes;
export type FileEntry = SshFileEntry;

export type Events = {
  'client-connected': [Connection];
  'client-disconnected': [Connection];
  'session-open': [{ connection: Connection; session: SshSession }];
  error: [Error];
};
