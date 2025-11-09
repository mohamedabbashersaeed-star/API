# 📁 Project Structure

## TypeScript Express Warehouse Inventory API

```
Cursor Project/
│
├── 📂 src/                          # Source code directory
│   └── index.ts                     # Main server file with CRUD API
│
├── 📂 public/                       # Static files directory
│   ├── index.html                   # Web interface for the API
│   ├── css/
│   │   └── style.css                # Dashboard styles
│   ├── js/
│   │   └── app.js                   # Frontend JavaScript
│   ├── CUSTOMIZATION_GUIDE.md       # Customization guide
│   └── customization-examples.css   # Theme examples
│
├── 📂 .vscode/                      # VS Code configuration
│   └── launch.json                  # Debug and run configurations
│
├── 📂 node_modules/                 # Dependencies (auto-generated)
│
├── 📄 package.json                  # Project configuration & dependencies
├── 📄 package-lock.json             # Locked dependency versions
├── 📄 tsconfig.json                 # TypeScript compiler configuration
│
├── 📄 api-test.http                 # REST Client test file
├── 📄 test-api.js                   # Automated Node.js test script
├── 📄 test.sh                       # Bash test script
│
└── 📄 PROJECT_STRUCTURE.md          # Project documentation
```

## 📋 File Descriptions

### Core Application Files

#### `src/index.ts`
- **Purpose**: Main Express server file
- **Contains**: 
  - Express app setup
  - In-memory inventory database (array)
  - CRUD API endpoints:
    - `GET /api/inventory` - Get all inventory items
    - `GET /api/inventory/stats` - Get statistics
    - `GET /api/inventory/:id` - Get specific item
    - `GET /api/inventory/low-stock` - Get low stock items
    - `GET /api/inventory/category/:category` - Get items by category
    - `POST /api/inventory` - Create new item
    - `PUT /api/inventory/:id` - Update item
    - `PATCH /api/inventory/:id/quantity` - Adjust quantity
    - `DELETE /api/inventory/:id` - Delete item
  - Static file serving
  - JSON middleware

#### `public/index.html`
- **Purpose**: Web interface for the API
- **Features**: 
  - Interactive UI to test all CRUD operations
  - Add, update, delete inventory items
  - View all inventory items in real-time
  - Stock level tracking and warnings
  - Category filtering and search

### Configuration Files

#### `package.json`
- **Purpose**: Project metadata and dependencies
- **Scripts**:
  - `npm run dev` - Run with ts-node (development)
  - `npm run build` - Compile TypeScript to JavaScript
  - `npm run start` - Run compiled JavaScript
  - `npm run build:watch` - Watch mode compilation
- **Dependencies**:
  - `express` - Web framework
- **DevDependencies**:
  - `typescript` - TypeScript compiler
  - `ts-node` - TypeScript execution
  - `@types/express` - TypeScript types for Express
  - `@types/node` - TypeScript types for Node.js

#### `tsconfig.json`
- **Purpose**: TypeScript compiler configuration
- **Key Settings**:
  - `rootDir`: `./src` - Source files location
  - `outDir`: `./dist` - Compiled output location
  - `module`: `commonjs` - Module system
  - `target`: `esnext` - ECMAScript version
  - `strict`: `true` - Strict type checking

#### `.vscode/launch.json`
- **Purpose**: VS Code debug configurations
- **Configurations**:
  - Debug TypeScript Server
  - Run API Tests
  - Launch Chrome against localhost

### Testing Files

#### `api-test.http`
- **Purpose**: REST Client test file
- **Usage**: Test API endpoints directly in VS Code
- **Contains**: Pre-configured requests for all CRUD operations

#### `test-api.js`
- **Purpose**: Automated Node.js test script
- **Usage**: Run `node test-api.js` to test all endpoints
- **Features**: Automated testing with pass/fail reporting

#### `test.sh`
- **Purpose**: Bash test script
- **Usage**: Run `./test.sh` to test API with curl
- **Features**: Quick manual testing via command line

### Generated Files

#### `node_modules/`
- **Purpose**: Installed npm packages
- **Note**: Auto-generated, don't edit manually
- **Size**: Can be large, typically excluded from version control

#### `package-lock.json`
- **Purpose**: Locked versions of all dependencies
- **Note**: Auto-generated, ensures consistent installs

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│         Client (Browser)            │
│    http://localhost:3000            │
└──────────────┬──────────────────────┘
               │
               │ HTTP Requests
               │
┌──────────────▼──────────────────────┐
│      Express Server (index.ts)      │
│  ┌──────────────────────────────┐  │
│  │  Middleware                  │  │
│  │  - express.json()            │  │
│  │  - express.static()          │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Routes                      │  │
│  │  - GET /api/inventory         │  │
│  │  - GET /api/inventory/stats   │  │
│  │  - GET /api/inventory/:id     │  │
│  │  - GET /api/inventory/low-stock│ │
│  │  - POST /api/inventory        │  │
│  │  - PUT /api/inventory/:id     │  │
│  │  - PATCH /api/inventory/:id/quantity│
│  │  - DELETE /api/inventory/:id   │  │
│  └──────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               │ In-Memory Storage
               │
┌──────────────▼──────────────────────┐
│      In-Memory Database             │
│      let inventory = [...]          │
└─────────────────────────────────────┘
```

## 📊 Data Flow

1. **Client Request** → Express Server
2. **Express Middleware** → Parses JSON, serves static files
3. **Route Handler** → Processes request
4. **In-Memory Database** → Stores/retrieves inventory items
5. **Response** → JSON data back to client

## 🚀 Development Workflow

1. **Development**: 
   - Edit `src/index.ts`
   - Run `npm run dev` or use VS Code debugger
   - Test with REST Client or browser

2. **Testing**:
   - Use `api-test.http` in VS Code
   - Run `node test-api.js` for automated tests
   - Use `./test.sh` for quick manual tests

3. **Production**:
   - Run `npm run build` to compile TypeScript
   - Run `npm start` to start the server
   - JavaScript files will be in `dist/` directory

## 📝 Key Concepts

- **TypeScript**: Type-safe JavaScript
- **Express**: Minimal web framework for Node.js
- **REST API**: RESTful API design (GET, POST, PUT, DELETE)
- **In-Memory Storage**: Data stored in server memory (resets on restart)
- **Static Files**: HTML/CSS/JS served directly by Express

## 🔄 Next Steps for Production

1. Add database (MongoDB, PostgreSQL, etc.)
2. Add authentication/authorization
3. Add input validation middleware
4. Add error handling middleware
5. Add logging
6. Add environment variables (.env)
7. Add unit tests (Jest, Mocha)
8. Add API documentation (Swagger)
9. Add CORS configuration
10. Add rate limiting


