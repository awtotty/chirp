## Things I learned while working on this project: 
- Use debug mode for `authMiddleware`
    - Clerk was blocking access to posts and accessing userList. 
    - I thought this was a config issue, and chased a solution for a few hours.
    - I finally tried adding `debug: true` to the clerk `authMiddleware` in `middleware.ts`. This revealed I had accidentally added a character to the secret key for clerk in the local .env file. 
- Clerk dashboard is where all the user management is done
    - My users all had `username` as `null`
    - Enabled usernames from Clerk dashboard
- `dayjs` is super easy for relative time
- `zod` does input shape validation
    - If using tRPC for api and `zod` for input form validation, likely need to specify shape of error message
    - See `trpc.ts` `errorFormatter` and https://trpc.io/docs/server/error-formatting#adding-custom-formatting for example
- Form submission in React likes to use `useState` for form state
    - see `CreatePostWizard` component for an example
- Linters are kind of great 

## Overview of deployment: 
Serverless deployment 
- Host stateless on Vercel
- Planetscale MySQL db with prisma ORM
- Auth with Clerk 
    - Holy cow clerk is amazing
    - consider moving to Auth.js (previously NextAuth) for future
- Axiom for logging
- Upstash for rate limiting (can also be used for redis, cron jobs, etc.) 