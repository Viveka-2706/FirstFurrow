// Errors the routes throw on purpose; the error middleware turns them into JSON responses.
export class HttpError extends Error {
  constructor(status, message, code = 'error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const badRequest = (msg, code = 'validation') => new HttpError(400, msg, code);
export const unauthorized = (msg = 'Please log in again.', code = 'unauthorized') => new HttpError(401, msg, code);
export const notFound = (msg = 'Not found') => new HttpError(404, msg, 'not_found');
export const conflict = (msg, code = 'conflict') => new HttpError(409, msg, code);

// thrown by the data layer when an email is already registered
export class DuplicateEmailError extends Error {}
