import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '~/server/api/root';
import superjson from 'superjson';
import { db } from '~/server/db';


export const generateSSGHelper = () => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    // TODO: auth should be passed in from the request? 
    ctx: { db, auth: null },
    transformer: superjson,
  });
  return ssg;
};