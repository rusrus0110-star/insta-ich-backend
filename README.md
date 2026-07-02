# Instagram-like Backend API

A backend API for a mini social media application similar to Instagram.

The project includes user authentication, profile management, posts, likes, comments, user search, and MongoDB data persistence using Mongoose.

## Project Purpose

## Project Purpose

The goal is to build a REST API for an Instagram-like social media application where users can:

- register and log in;
- reset their password;
- manage their profile;
- search users;
- follow and unfollow other users;
- create, update and delete posts;
- like and unlike posts;
- add and delete comments;
- receive notifications for follows, likes and comments;
- create conversations and exchange messages;
- store all data in MongoDB.

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Token
- bcrypt
- dotenv
- cors
- helmet
- morgan
- express-rate-limit

## Project Structure

```txt
src/
  config/
    db.js
  controllers/
    auth_controller.js
    user_controller.js
    post_controller.js
    comment_controller.js
  middlewares/
    auth_middleware.js
    error_middleware.js
    not_found_middleware.js
  models/
    user_model.js
    post_model.js
    comment_model.js
  routes/
    auth_routes.js
    user_routes.js
    post_routes.js
    comment_routes.js
  utils/
    async_handler.js
    generate_token.js
  app.js

server.js
.env.example
.gitignore
package.json
README.md
```

# Environment Variables

# Variable Description

NODE_ENV Application environment
PORT Server port
MONGO_URI MongoDB Atlas connection string
JWT_SECRET Secret key for JWT signing
JWT_EXPIRES_IN JWT expiration time
CLIENT_URL Frontend URL for CORS

# Postman Testing Order

Recommended testing flow:

1. GET /api/health
2. POST /api/auth/register
3. POST /api/auth/login
4. GET /api/auth/me
5. PUT /api/users/profile
6. GET /api/users/search?query=rus
7. POST /api/posts
8. GET /api/posts
9. GET /api/posts/:post_id
10. GET /api/posts/user/:user_id
11. PUT /api/posts/:post_id
12. POST /api/posts/:post_id/like
13. POST /api/posts/:post_id/like
14. POST /api/posts/:post_id/comments
15. GET /api/posts/:post_id/comments
16. DELETE /api/comments/:comment_id
17. DELETE /api/posts/:post_id
