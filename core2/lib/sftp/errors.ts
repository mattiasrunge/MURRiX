import { utils } from 'ssh2';

// https://gist.github.com/slavafomin/b164e3e710a6fc9352c934b9073e7216

class GenericError extends Error {
  status: number;

  constructor(message?: string, status = utils.sftp.STATUS_CODE.FAILURE) {
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    this.status = status;
  }
}

export class NoSuchFileError extends GenericError {
  constructor(message?: string) {
    super(message, utils.sftp.STATUS_CODE.NO_SUCH_FILE);
  }
}

export class PermissionDeniedError extends GenericError {
  constructor(message?: string) {
    super(message, utils.sftp.STATUS_CODE.PERMISSION_DENIED);
  }
}

export class BadMessageError extends GenericError {
  constructor(message?: string) {
    super(message, utils.sftp.STATUS_CODE.BAD_MESSAGE);
  }
}

export class OpUnsupportedError extends GenericError {
  constructor(message?: string) {
    super(message, utils.sftp.STATUS_CODE.OP_UNSUPPORTED);
  }
}
