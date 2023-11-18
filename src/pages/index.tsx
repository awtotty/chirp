import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toast from "react-hot-toast";

import { RouterOutputs, api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";


dayjs.extend(relativeTime);

// component for creating a post
const CreatePostWizard = () => {
  const [input, setInput] = useState("");

  // tRPC hook for state invalidation and other things
  const apiUtils = api.useUtils();

  // define the mutation and what to do when it succeeds
  const { mutateAsync: createPost, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: async () => {
      setInput("");
      await apiUtils.post.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      }
      else {
        toast.error("Error creating post");
      }
    }
  });

  return (
    <div className="flex gap-3 w-full">
      <UserButton afterSignOutUrl="/" />
      <input
        placeholder="Emoji something"
        className="bg-transparent grow outline-none text-size-2xl flex-grow"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            try {
              await createPost({ content: input });
            } catch (e) {
            }
          }
        }}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={isPosting}
        onClick={async () => {
          await createPost({ content: input });
        }}>Post</button>
    </div>
  );
};

// component for creating a post and user management 
const UserPostTopBar = () => {
  return (
    <>
      <div className="flex align-right border-b border-slate-400 p-4 flex">
        <SignedIn>
          <CreatePostWizard />
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton />
        </SignedOut>
      </div>
    </>
  )
};

// Feed is a sequence of PostsViews
const Feed = () => {
  // can use cached data from earlier useQuery() call here
  const { data: posts, isLoading: postsLoading } = api.post.getAll.useQuery();

  if (postsLoading) {
    return <LoadingPage />;
  }

  if (!posts) {
    return <div>Error loading posts...</div>;
  }

  return (
    <div className="flex flex-col">
      {posts?.map((postWithAuthor) => (
        <PostView {...postWithAuthor} key={postWithAuthor.post.id} />
      ))}
    </div>
  )
}


// Homepage
export default function Home() {
  const { user, isLoaded: userLoaded } = useUser();

  // start fetching posts early, cached version is used later in Feed render
  api.post.getAll.useQuery();

  // if user is not loaded, show loading page
  if (!userLoaded) {
    return <LoadingPage />
  }

  return (
    <>
      <Head>
        <title>Chirp</title>
        <meta name="description" content="Emoji-only Twitter Clone" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageLayout>
        <UserPostTopBar />
        <Feed />
      </PageLayout>
    </>
  );
}
