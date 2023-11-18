import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";
import { LoadingPage } from "~/components/loading";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";


// Post page
export default function SinglePostPage(props: { postId: number }) {
  const { data, isLoading } = api.post.getPostById.useQuery({
    postId: props.postId,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return <div>Post not found!</div>;
  }

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <div className="flex flex-col">
          <PostView key={data.post.id} {...data} />
        </div>
      </PageLayout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
  const ssg = generateSSGHelper();

  const slug = context.params?.id as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  const postId = parseInt(slug);

  await ssg.post.getPostById.prefetch({ postId });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      postId: postId
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
