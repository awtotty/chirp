import { Redis } from "@upstash/redis";
import { clerkClient } from "@clerk/nextjs";
import { filterUserForClient } from "./filterUserForClient";

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

// Cache key prefix
const CACHE_KEY_PREFIX = "clerk:user:";

// Lazy initialize Redis to avoid build-time issues
let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

type FilteredUser = {
  id: string;
  username: string | null;
  imgUrl: string;
};

/**
 * Fetches a single user from cache or Clerk API
 */
export async function getUserById(userId: string): Promise<FilteredUser | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

  // Try to get from cache first
  const cachedUser = await getRedis().get<FilteredUser>(cacheKey);
  if (cachedUser) {
    return cachedUser;
  }

  // If not in cache, fetch from Clerk
  try {
    const user = await clerkClient.users.getUser(userId);
    const filteredUser = filterUserForClient(user);

    // Store in cache
    await getRedis().setex(cacheKey, CACHE_TTL, filteredUser);

    return filteredUser;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    return null;
  }
}

/**
 * Fetches multiple users from cache or Clerk API
 * Uses cache-first approach and only fetches uncached users from Clerk
 */
export async function getCachedUsers(userIds: string[]): Promise<FilteredUser[]> {
  // Remove duplicates
  const uniqueUserIds = Array.from(new Set(userIds));

  // Try to get all users from cache
  const cacheKeys = uniqueUserIds.map(id => `${CACHE_KEY_PREFIX}${id}`);
  const cachedResults = await getRedis().mget<FilteredUser[]>(...cacheKeys);

  const users: FilteredUser[] = [];
  const uncachedUserIds: string[] = [];

  // Separate cached and uncached users
  uniqueUserIds.forEach((userId, index) => {
    const cachedUser = cachedResults[index];
    if (cachedUser) {
      users.push(cachedUser);
    } else {
      uncachedUserIds.push(userId);
    }
  });

  // If all users were cached, return early
  if (uncachedUserIds.length === 0) {
    return users;
  }

  // Fetch uncached users from Clerk
  try {
    const clerkUsers = await clerkClient.users.getUserList({
      userId: uncachedUserIds,
      limit: 100,
    });

    // Filter and cache the new users
    const filteredUsers = clerkUsers.map(filterUserForClient);

    // Cache each user individually
    const cachePromises = filteredUsers.map(user =>
      getRedis().setex(`${CACHE_KEY_PREFIX}${user.id}`, CACHE_TTL, user)
    );
    await Promise.all(cachePromises);

    users.push(...filteredUsers);
  } catch (error) {
    console.error("Failed to fetch users from Clerk:", error);
  }

  return users;
}

/**
 * Invalidates a user's cache entry
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
  await getRedis().del(cacheKey);
}
