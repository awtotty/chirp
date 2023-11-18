import type { User } from "@clerk/nextjs/dist/types/server";

// client should only see limited info about a user for rendering posts
export const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    imgUrl: user.imageUrl
  }
};
