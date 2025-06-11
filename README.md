# Bill Vending Backend Service

### Key Components
- **Wallet Management**: Fund, balance check, debit operations
- **Bill Vending**: Async transaction processing with external API calls
- **Event-Driven Reversals**: Queue-based failure handling
- **Concurrency Control**: Database-level locking and transaction isolation
- **Comprehensive Logging**: Structured logging with transaction tracking

## Project Structure

```bash
                          +------------------+
                          |  API Gateway     |  ← Swagger-enabled entry point
                          +--------+---------+
                                   |
                                   ▼
          ┌────────────────────────────────────────────────────┐
          |                NestJS Application                  |
          | (Modular Monolith with Internal Event Bus/Queue)   |
          └────────────────────────────────────────────────────┘
             │           │             │                │
             ▼           ▼             ▼                ▼
        +--------+   +--------+   +-------------+   +------------+
        | Wallet |   | Bills  |   | Transactions|   | Reversal   |
        | Module |   | Module |   |  Module     |   | Module     |
        +--------+   +--------+   +-------------+   +------------+
             │           │             │                │
             ▼           ▼             ▼                ▼
         Wallet DB   External API   Transaction DB   Event Queue (Mock)

                                        ▲
                                        │
                        +---------------+------------------+
                        |        Event Handler Module       |
                        | (Listens for "TransactionFailed", |
                        | "BillProcessed", etc.)            |
                        +-----------------------------------+
```

```
├── package-lock.json
├── package.json
├── pgadmin
│   └── servers.json
├── src
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── bill-payment
│   │   ├── bill-payment.module.ts
│   │   ├── controller
│   │   │   └── bill-payment.controller.ts
│   │   ├── dto
│   │   │   └── bill.dto.ts
│   │   ├── entity
│   │   │   └── bill.entity.ts
│   │   ├── enums
│   │   │   └── bill.enum.ts
│   │   └── service
│   │       ├── bill-payment.service.spec.ts
│   │       └── bill-payment.service.ts
│   ├── common
│   │   ├── exceptions
│   │   │   └── exceptions.ts
│   │   ├── filters
│   │   │   └── all-exceptions.filter.ts
│   │   ├── interceptors
│   │   │   └── logging.interceptor.ts
│   │   ├── logger
│   │   │   └── winston.config.ts
│   │   ├── mock
│   │   │   ├── mock-bill-api.service.ts
│   │   │   └── mock-queue.service.ts
│   │   └── models
│   │       ├── base.dto.ts
│   │       └── base.entity.ts
│   ├── config
│   │   ├── database
│   │   │   └── database.config.ts
│   │   └── queue
│   │       └── queue.config.ts
│   ├── external
│   │   ├── external.module.ts
│   │   └── service
│   │       └── bills-payment.external.service.ts
│   ├── main.ts
│   ├── queue
│   │   ├── queue.module.ts
│   │   ├── service
│   │   │   └── reversal-processor.entity.ts
│   │   └── types
│   │       └── queue.types.ts
│   ├── transaction
│   │   ├── controller
│   │   │   └── transaction.controller.ts
│   │   ├── dto
│   │   │   └── transaction.dto.ts
│   │   ├── entity
│   │   │   └── transaction.entity.ts
│   │   ├── enums
│   │   │   └── transaction.enum.ts
│   │   ├── service
│   │   │   └── transaction.service.ts
│   │   ├── transaction.module.ts
│   │   └── types
│   │       └── transaction.types.ts
│   └── wallet
│       ├── controller
│       │   └── wallet.controller.ts
│       ├── dto
│       │   └── wallet.dto.ts
│       ├── entity
│       │   └── wallet.entity.ts
│       ├── enums
│       ├── service
│       │   └── wallet.service.ts
│       └── wallet.module.ts
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── tsconfig.build.json
└── tsconfig.json

```

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd bill-vending-service
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create `.env` file:
```env
# Database
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=bill_vending

# Application
PORT=3000
NODE_ENV=development

# Queue (Redis for Bull)
REDIS_HOST=localhost
REDIS_PORT=6379

# External API
BILL_PAYMENT_API_URL=https://mock-bill-api.com
BILL_PAYMENT_API_KEY=mock-api-key

```

4. **Database Setup**
```bash
# Run migrations
npm run migration:run

# Start the application
npm run start:dev
```

### Docker Setup (Alternative)
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run the application
npm run start:dev
```

## API Documentation

### Swagger/OpenAPI
Access API documentation at: `http://localhost:3000/api-docs`

### PG ADMIN
Access PG Admin Dashboard at: `http://localhost:5050`

```bash
username: admin@admin.com
password: Admin@123
```
## Testing Strategy

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm ci --legacy-peer-deps --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]

```
