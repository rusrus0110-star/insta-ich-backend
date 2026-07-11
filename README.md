# ICHgram Backend API

Backend REST API for an Instagram-like social media application.

The API supports authentication, user profiles, posts, likes, comments, follows, notifications, conversations, messages, and image upload integration.

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcrypt
- Cloudinary
- Socket.io
- dotenv
- cors
- helmet
- morgan
- express-rate-limit

## Main Features

- User registration and login
- JWT-protected routes
- Current user profile
- Profile update with avatar URL
- User search
- Follow / unfollow users
- Create, edit and delete posts
- Like / unlike posts
- Add and delete comments
- Notifications for likes, comments and follows
- Conversations and direct messages
- Image upload via Cloudinary
- MongoDB data persistence

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Notes
All protected routes require a JWT token in the Authorization header.
Images are uploaded to Cloudinary and stored in MongoDB as URLs.
Notifications are created for follows, likes, and comments.
Messages use REST endpoints and Socket.io for real-time updates.
