# Okada_Connect Backend

Okada_Connect Backend is the server-side component of the Okada_Connect platform, designed to handle user authentication, profile management, and more. It leverages a robust set of technologies and tools to provide a secure and efficient service.

## Technologies Used

- **Node.js**: A JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Express**: A minimal and flexible Node.js web application framework.
- **Sequelize**: A promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite, and Microsoft SQL Server.
- **SQLite3**: A C library that provides a lightweight disk-based database.

## Dependencies

Below are the npm packages required for the project:

### Core Packages
```bash
npm install express sequelize sqlite3
npm install sequelize-cli
npm install bcryptjs
npm install jsonwebtoken
npm install cors
npm install express-validator
npm install nodemailer
npm install ioredis
npm install swagger-ui-express swagger-jsdoc
npm install redis
npm install dotenv --save
npm install multer --save # Middleware for uploading files

### Planned to be Used
```bash
npm install morgan # HTTP request logger middleware
npm install sequelize-paginate # Pagination helper for Sequelize models
npm install node-schedule # A cron-like job scheduler
```

## Installation

Clone the repository and install its dependencies:

```bash
git clone https://github.com/yourusername/okada_connect.git
cd okada_connect
npm install
```

## Configuration

Create a `.env` file in the root directory and configure the following environment variables:

```plaintext
PORT=3005
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
EMAIL_HOST=your_smtp_host
EMAIL_PORT=465
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password
EMAIL_FROM=your_email@example.com
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

The backend supports several API endpoints under the authentication module:

## Authentication
- **POST** `api/auth/register` - Register a new user.
- **POST** `api/auth/login` - User login.
- **POST** `api/auth/logout` - User logout.
- **POST** `api/auth/refresh` - Refresh authentication token.
- **POST** /api/auth/verify-email - Verify user email
- **POST** /api/auth/forgot-password - Forgot password
- **POST** /api/auth/reset-password - Reset password

## Running the Server

To start the server, run:

```bash
npm start
```

This will launch the server on the port specified in your `.env` file (default is 3005).

## Testing

To execute tests written with Jest:

```bash
npm test
```

## Contributing

Contributions to the Okada_Connect Backend are welcome! Please feel free to fork the repository, make changes, and submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
```