const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // we could store the token in query parameters, and it's ok
  // but we do it in header instead, which is also ok
  try {
    const token = req.headers.authorization.split(' ')[1]; // format: Bearer [actual token] for some reason this is the pattern
    // verify token
    const decodedToken = jwt.verify(token, 'MAKE THIS LONGER'); // if this doesn't throw error, we want to call next(), else error
    req.userData = {email: decodedToken.email, userId: decodedToken._id};
    next();
  } catch(err) {
    // we don't need to have token, or it can fail!
    res.status(401).json({message: 'You are not authenitcated!'});
  }

}
