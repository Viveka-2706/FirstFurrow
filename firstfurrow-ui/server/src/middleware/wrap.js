// Express 4 does not catch errors thrown inside async handlers; this forwards them to the error middleware.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
