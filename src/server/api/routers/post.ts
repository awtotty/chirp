import { auth, clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import type { Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";


const addUserDataToPosts = async (posts: Post[]) => {
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

    return addUserDataToPosts(posts);
  }),

  getPostsByUserId: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const posts = await ctx.db.post.findMany({
        where: { authorId: input.userId },
        take: 100,
        orderBy: { createdAt: "desc" },
      })
      return addUserDataToPosts(posts);
    }),

  create: protectedProcedure.input(
    z.object({
      content: z.string().emoji("Only emojis are allowed").min(1).max(280),
    }),
  ).mutation(async ({ ctx, input }) => {
    // User has to be signed in to create a post
    const userId = ctx.auth.userId;

    // Create a new ratelimiter, that allows 3 requests per 1 minute 
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      analytics: true,
      /**
       * Optional prefix for the keys used in redis. This is useful if you want to share a redis
       * instance with other applications and want to avoid key collisions. The default prefix is
       * "@upstash/ratelimit"
       */
      prefix: "@upstash/ratelimit",
    });

    const { success } = await ratelimit.limit(userId);
    if (!success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests" });
    }

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