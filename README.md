# NextJS Backend

A plug-and-play, serverless NextJS and MongoDB backend following the principles of a layered service-repository architecture.

Contains user related properties and methods.

## Layers

### Repository Layer (Data Access Layer)
- Handles database persistence.
- Comprised of basic database operations. In this case, it's MongoDB operations.

### Service Layer
- Handles and enforces business logic.
- Uses the functionality implemented in the repository layer to implement more detailed and rigid functionality.

### Presentation Layer
- Handles client inputs and calls service functions based on the client inputs.
- Implements session and authorization to the service layer functionality.

The backend also uses dependency injections and dependency inversion principles.

This means that the backend is more flexible as the dependencies are tied to each other loosely; which makes changing and adding functionality easier and worry-free.

## Packages used:
| Package name | Use Case |
|--------------|----------|
| AuthJS | Authentication and authorization |
| Mongoose | Database connection, operations and object modelling |
| Pino | Logging |
| Zod | Schema validation |
| bcrypt | Hashing and encryption |
