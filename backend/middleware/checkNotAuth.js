const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // we could store the token in query parameters, and it's ok
  // but we do it in header instead, which is also ok
   try {
    const token = req.headers.authorization.split(' ')[1]; // format: Bearer [actual token] for some reason this is the pattern
    // verify token
    // const decodedToken =  // if this doesn't throw error, we want to call next(), else error
    jwt.verify(token, "MAKE THIS LONGER");
    // req.userData = {email: decodedToken.email, userId: decodedToken.userId};
    // console.log("FROM DECRYPT: ", req.userData);
    res.status(401).json({message : 'This can not be done while logged in'})
  } catch(err) {
    next();
  }
}
