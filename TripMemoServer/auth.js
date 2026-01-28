export default function requireAuth(req, res, next) {
  const userId = req.cookies.session;
  if (!userId) return res.sendStatus(401);

  req.userId = userId;
  next();
}
