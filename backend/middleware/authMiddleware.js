const jwt = require('jsonwebtoken');
const config = require('../config/jwt');  // assuming you are using a config file for your JWT secret key

// Middleware function
const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];  // Extract token from 'Bearer <token>'

  // Check if no token is provided
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret);  // Access jwtSecret directly

    // Attach the user to the request object
    req.user = decoded;

    // console.log(req.user);
    
    // Call next middleware or route handler
    next();
  } catch (err) {
    // Token is invalid or expired
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
