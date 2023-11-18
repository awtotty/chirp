import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '~/server/api/root';
import superjson from 'superjson';
import { db } from '~/server/db';
import { PageLayout } from "~/components/layout";


// Profile page stub
export default function ProfilePage(props: { username: string } ) {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username: props.username,
  });

  if (isLoading) {
    console.log('Loading');
    return <div>Loading...</div>;
  } 

  if (!data) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <PageLayout>
        <div>{data.username}</div>
      </PageLayout>
    </>
  );
}


export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    // TODO: auth should be passed in from the request? 
    ctx: { db, auth: null },
    transformer: superjson, 
  });

  const slug = context.params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  const username = slug.replace('@', '');

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username: username, 
    },
    // revalidate: 1,
  };
};  

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
}
