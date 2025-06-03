module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'test-jwt-secret-key',  // Store your JWT secret key here
    jwtExpiration: process.env.JWT_EXPIRATION || '1h',  // Optional: Set JWT token expiration time
  };
  