Things I learned while working on this project: 
- Issue: clerk was blocking access to posts and accessing userList. 
    - I thought this was a config issue, and chased a solution for a few hours.
    - Resolution: I finally tried adding `debug: true` to the clerk `authMiddleware` in `middleware.ts`. This revealed I had accidentally added a character to the secret key for clerk in the local .env file. 
    - Takeaway: use debug mode for `authMiddleware`
