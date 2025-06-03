// utils/redis.js

const Redis = require('ioredis');
const redis = new Redis(); // Default connection to localhost:6379

module.exports = redis;
