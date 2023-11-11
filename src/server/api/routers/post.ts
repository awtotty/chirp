import { auth, clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

// client should only see limited info about a user for rendering posts
const filterUserForClient = (user: User) => {
  return { id: user.id, username: user.username, imgUrl: user.imageUrl }
};

export const postRouter = createTRPCRouter({
  getLatest: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });
  }),

  // define a route endpoint and what it should do 
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    // find users that authored the posts
    const users = await clerkClient.users.getUserList({
      userId: posts.map(post => post.authorId),
      limit: 100,
    });

    // filter out their sensitive user info
    const filteredUsers = users.map(filterUserForClient);

    // bundle the post and user info together
    return posts.map((post) => {
      const author = filteredUsers.find(user => user.id === post.authorId);

      if (!author?.username) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Author not found" });
      }

      return {
        post,
        author: author,
      }
    })
  }),

  create: protectedProcedure.input(
    z.object({
      content: z.string().emoji().min(1).max(280),
    }),
  ).mutation(async ({ ctx, input }) => {
    const userId = ctx.auth.userId;

    const newPost = await ctx.db.post.create({
      data: {
        authorId: userId,
        name: "",
        content: input.content,
      },
    });

    return newPost;
  }),
});