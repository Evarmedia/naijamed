# API Endpoints Documentation

## Authentication
- **POST** `api/auth/register` - Register a new user.
- **POST** `api/auth/login` - User login.
- **POST** `api/auth/logout` - User logout.
- **POST** `api/auth/refresh` - Refresh authentication token.
- **POST** /api/auth/verify-email - Verify user email
- **POST** /api/auth/forgot-password - Forgot password
- **POST** /api/auth/reset-password - Reset password

## Users
- **GET** `api/users` - Retrieve all users.
- **GET** `api/users/{user_id}` - Retrieve a specific user Profile by ID.
- **PUT** `api/users/{user_id}` - Update user information.
- **DELETE** `api/users/{user_id}` - Delete a user.

## Roles
- **GET** `api/roles` - Retrieve all roles.
- **GET** `api/roles/{role_id}` - Retrieve a role by ID.
- **PUT** `api/roles/{role_id}` - Update a role.
- **DELETE** `api/roles/{role_id}` - Delete a role.

## Clients
- **POST** `api/clients` - Register a new client.
- **GET** `api/clients` - Retrieve all clients.
- **GET** `api/clients/{client_id}` - Retrieve a specific client by ID.
- **PUT** `api/clients/{client_id}` - Update client information.
- **DELETE** `api/clients/{client_id}` - Delete a client.

## Vehicle Types
- **POST** `/vehicle-types` - Add a new vehicle type.
- **GET** `/vehicle-types` - List all vehicle types.
- **PUT** `/vehicle-types/{vehicle_types_id}` - Update a vehicle type.
- **DELETE** `/vehicle-types/{vehicle_types_id}` - Delete a vehicle type.

## Vehicles
- **POST** `/vehicles` - Register a new vehicle.
- **GET** `/vehicles` - Retrieve all vehicles.
- **GET** `/vehicles/{vehicle_id}` - Get a vehicle by ID.
- **PUT** `/vehicles/{vehicle_id}` - Update vehicle information.
- **DELETE** `/vehicles/{vehicle_id}` - Delete a vehicle.

## Driver Profiles
- **POST** `/drivers` - Create a new driver profile.
- **GET** `/drivers` - List all driver profiles.
- **GET** `/drivers/{driver_id}` - Retrieve a driver profile by ID.
- **PUT** `/drivers/{driver_id}` - Update a driver profile.
- **DELETE** `/drivers/{driver_id}` - Delete a driver profile.

## Driver Locations
- **POST** `/driver-locations` - Log a new location for a driver.
- **GET** `/driver-locations/{driver_id}` - Retrieve location history for a driver.

## Driver Statistics
- **GET** `/driver-statistics/{driver_id}` - Retrieve statistics for a driver.
- **PUT** `/driver-statistics/{driver_id}` - Update statistics for a driver.

## Vendor Profiles
- **POST** `/vendors` - Create a new vendor profile.
- **GET** `/vendors` - Retrieve all vendor profiles.
- **GET** `/vendors/{vendor_profiles_id}` - Retrieve a vendor profile by ID.
- **PUT** `/vendors/{vendor_profiles_id}` - Update vendor profile.
- **DELETE** `/vendors/{vendor_profiles_id}` - Delete a vendor profile.

## Transactions
- **POST** `/transactions` - Initiate a new transaction.
- **GET** `/transactions` - Retrieve all transactions.
- **GET** `/transactions/{transactions_id}` - Retrieve a specific transaction by ID.

## Ride Requests
- **POST** `/ride-requests` - Create a new ride request.
- **GET** `/ride-requests` - List all ride requests.
- **GET** `/ride-requests/{ride_request_id}` - Get details of a specific ride request.
- **PUT** `/ride-requests/{ride_request_id}` - Update a ride request.
- **DELETE** `/ride-requests/{ride_request_id}` - Cancel a ride request.

## Addresses
- **POST** `/addresses` - Add a new address.
- **GET** `/addresses/{address_id}` - Retrieve an address by ID.
- **PUT** `/addresses/{address_id}` - Update an address.
- **DELETE** `/addresses/{address_id}` - Remove an address.
