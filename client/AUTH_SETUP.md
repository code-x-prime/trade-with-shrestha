# Authentication Setup Complete ✅

## What's Been Set Up

### 1. **Tailwind Config Updated**
- Added brand color `#5C64D7` to Tailwind config
- Updated primary color in globals.css to use brand color

### 2. **API Utility Created** (`src/lib/api.js`)
- Centralized API calls
- All auth, user, upload, and contact APIs in one place
- Automatic token handling
- Cookie support for authentication

### 3. **Auth Context & Provider** (`src/contexts/AuthContext.jsx`)
- Global auth state management
- Login, signup, OTP verification, Google auth
- Automatic redirects based on user role
- User data management

### 4. **Auth Page** (`src/app/auth/page.jsx`)
- Single page for Login, Signup, and OTP verification
- Smooth transitions between modes
- Google OAuth button (needs Google OAuth SDK integration)
- Beautiful UI with shadcn components

### 5. **Admin Layout** (`src/app/admin/layout.jsx`)
- Sidebar navigation
- Protected route (requires admin role)
- Dashboard, Users, Courses, Settings menu items
- Profile and logout buttons

### 6. **Profile Page** (`src/app/profile/page.jsx`)
- User profile management
- Avatar upload (R2 integration)
- Update name and phone
- Account information display

### 7. **Routing & Middleware**
- Middleware for protected routes
- Automatic redirects:
  - Admin → `/admin`
  - User → `/profile`
  - Unauthenticated → `/auth`

### 8. **Contact API** (Server)
- Contact form API endpoint
- Email notifications

## Required Shadcn Components (Already Installed ✅)
- ✅ button
- ✅ card
- ✅ input
- ✅ label
- ✅ separator
- ✅ sidebar
- ✅ dialog
- ✅ sheet
- ✅ checkbox
- ✅ tooltip
- ✅ skeleton

## Environment Variables Needed

Create `.env.local` in `client` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## How to Use

### 1. Start the Server
```bash
cd server
npm run dev
```

### 2. Start the Client
```bash
cd client
npm run dev
```

### 3. Access the App
- Open `http://localhost:3000`
- You'll be redirected to `/auth` if not logged in
- After login:
  - Admin users → `/admin`
  - Regular users → `/profile`

## API Endpoints Available

### Auth APIs (via `authAPI`)
- `signup(email, password, name, phone?)`
- `login(email, password)`
- `verifyOTP(email, otp, purpose?)`
- `googleAuth(googleData)`
- `forgotPassword(email)`
- `resetPassword(email, otp, newPassword)`
- `logout()`
- `refreshToken()`

### User APIs (via `userAPI`)
- `getProfile()`
- `updateProfile(data)`
- `uploadAvatar(file)`
- `changePassword(currentPassword, newPassword)`
- `deleteAccount()`

### Upload APIs (via `uploadAPI`)
- `uploadFile(file, folder?)`
- `deleteFile(fileUrl)` - Admin only
- `getSignedUrl(fileUrl, expiresIn?)`

### Contact API (via `contactAPI`)
- `sendMessage({ name, email, subject, message, phone? })`

## Google OAuth Integration

To enable Google OAuth, you need to:

1. Install Google OAuth SDK:
```bash
npm install @react-oauth/google
```

2. Update `src/app/auth/page.jsx` to use Google OAuth SDK
3. Add Google OAuth credentials to `.env.local`

## Notes

- All API calls automatically include authentication tokens
- Cookies are used for session management
- Avatar uploads go to Cloudflare R2
- Admin routes are protected and require ADMIN role
- User routes require authentication

## Next Steps

1. Set up Google OAuth (if needed)
2. Add more admin pages (users, courses, etc.)
3. Add more user pages (dashboard, courses, etc.)
4. Customize styling as needed

Everything is ready to use! 🚀

