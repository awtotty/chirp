import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { PostView } from "~/components/postview";
import { LoadingPage } from "~/components/loading";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";


const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.post.getPostsByUserId.useQuery({
    userId: props.userId,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data || data.length === 0) {
    return <div>No posts yet!</div>;
  }

  return (
    <div className="flex flex-col">
      {data.map(fullPost => (
        <PostView key={fullPost.post.id} {...fullPost} /> 
      ))}
    </div>
  )
};

// Profile page stub
export default function ProfilePage(props: { username: string }) {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username: props.username,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return <div>404</div>;
  }

  return (
    <>
      <Head>
        <title>{`@${data.username}`}</title>
      </Head>
      <PageLayout>
        <div className="relative border-slate-400 bg-slate-600 h-48">
          <Image
            src={data.imgUrl}
            alt={`@${data.username ?? ""}'s profile image`}
            width={128}
            height={128}
            className="-mb-[64px] rounded-full absolute bottom-0 left-0 ml-4 border-4 border-black bg-black"
          />
        </div>
        {/* hidden spacer */}
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold border-b border-slate-400">
          {`@${data.username}`}
        </div>
        <div className="border-b border-slate-400">
          <ProfileFeed userId={data.id} />
        </div>
      </PageLayout>
    </>
  );
}


export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
  const ssg = generateSSGHelper(); 

  const slug = context.params?.profile as string;

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
