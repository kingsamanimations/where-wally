# where-wally
# Where's Wally/Waldo

This is a demo Where's Waldo project from the Odin Project. I had help from research to help me build and understand this.

This game allows you to find Wally and Wenda in a map of an area filled with busy people. 

- Update
The game has a network error that prevents me from finding Odlaw.I've been finding it difficult to solve this error on my own, so I've put a halt to it.

-Client Side:



## Tech:
- Node.js, Express
- PostgreSQL with Prisma 7
- JSON Web Tokens (`jsonwebtoken`) and `bcryptjs` for password hashing

Setup

## Setup

1. Install dependencies:

```bash
   npm install
```

2. Create a `.env` file (see `.env.example`)
```
   DATABASE_URL="postgresql://wally:dev-password@localhost:5432/wally_dev"
JWT_SECRET="long-string"
PORT=3000
```
