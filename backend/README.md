# Backend Setup Instructions

## Prerequisites
- Node.js installed on your system
- SQLite3 (comes with Node.js)

## Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

4. **The server will start on:** `http://localhost:3001`

## Database Setup

The database (`zachariahtippett.db`) will be created automatically when you start the server. It includes:
- Admin credentials table
- Shows, videos, products, donations, photos tables
- Default admin user `admin`, with a password generated on first run and printed once to the server log (or set via `ADMIN_DEFAULT_PASSWORD`)

## API Endpoints

### Public (no authentication required):
- `GET /api/shows` - Get all shows
- `GET /api/videos` - Get all videos  
- `GET /api/products` - Get all products
- `GET /api/donations` - Get all donations
- `GET /api/photos` - Get all photos

### Admin (authentication required):
- `POST /api/admin/login` - Login with username/password
- `PUT /api/admin/credentials` - Update admin credentials
- `POST /api/shows` - Add new show
- `PUT /api/shows/:id` - Update show
- `DELETE /api/shows/:id` - Delete show
- `POST /api/videos` - Add new video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/donations` - Add new donation
- `POST /api/photos` - Add new photo
- `PUT /api/photos/:id` - Update photo
- `DELETE /api/photos/:id` - Delete photo

## Testing

1. **Start the backend server:**
   ```bash
   cd backend && npm run dev
   ```

2. **In another terminal, start the frontend:**
   ```bash
   npm run dev
   ```

3. **Access the website:** `http://localhost:5173`

4. **Access admin dashboard:** Use keyboard shortcut `Ctrl + Tab + Down Arrow` or visit `/dash`

5. **Login with:** `admin` and the password printed to the server log on first run (or your `ADMIN_DEFAULT_PASSWORD`)

## Environment Variables

Create a `.env` file in the backend directory:
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_DEFAULT_PASSWORD=
FRONTEND_URL=https://your-frontend.vercel.app
```
`JWT_SECRET` and `STRIPE_SECRET_KEY` are required — the server refuses to start without them.

## Security Notes

- Change the default JWT_SECRET in production
- Change the default admin credentials after first login
- The API uses JWT tokens for authentication (24-hour expiry)
- All admin endpoints require valid JWT token in Authorization header

## Deployment

For production deployment:
1. Set up a proper database (PostgreSQL recommended)
2. Use environment variables for all secrets
3. Set up CORS properly for your domain
4. Consider using a reverse proxy (nginx)
