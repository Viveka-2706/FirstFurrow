import { unauthorized } from '../errors.js';
import { verifyToken } from '../services/auth.js';

export function requireAuth(config, repo) {
  return async (req, _res, next) => {
    try {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) throw unauthorized();
      const { userId, issuedAt } = verifyToken(token, config);
      const user = await repo.users.findById(userId);
      // a valid token for a deleted account must not work…
      if (!user) throw unauthorized();
      // …and neither must one issued before the password was last reset (that is the point of resetting it)
      if (user.passwordChangedAt && issuedAt < Math.floor(new Date(user.passwordChangedAt).getTime() / 1000)) throw unauthorized();
      req.userId = userId;
      next();
    } catch (err) {
      next(err);
    }
  };
}
