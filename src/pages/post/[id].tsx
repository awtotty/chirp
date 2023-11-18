import Head from "next/head";
import { PageLayout } from "~/components/layout";

// Single post page stub 
export default function SinglePostPage() {
  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <PageLayout>
        <div>Post stub</div>
      </PageLayout>
    </>
  );
}