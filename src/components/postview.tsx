import { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";


dayjs.extend(relativeTime);

type PostWithAuthor = RouterOutputs["post"]["getAll"][0];

// component for viewing a post
export const PostView = (props: PostWithAuthor) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="border-b border-slate-400 p-4 flex gap-2 flex-row">
      <div className="flex flex-col justify-center">
        <Link href={`/@${author.username}`}>
          <Image
            src={author.imgUrl}
            className="w-8 h-8 rounded-full justify justify-center"
            alt={`@${author.username}'s profile image`}
            width={32}
            height={32}
          // placeholder="blur"
          // blurDataURL="default-avatar.png"
          />
        </Link>
      </div>

      <div className="flex flex-col justify-center text-slate-500">
      </div>

      <div className="flex-grow flex flex-col justify justify-center">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>
              {`@${author.username}`}
            </span>
          </Link>
          <span className="mx-2 text-slate-400">·</span>
          <Link href={`/post/${post.id}`}>
            <span className="text-slate-400">
              {dayjs(post.createdAt).fromNow()}
            </span>
          </Link>
        </div>
        <Link href={`/post/${post.id}`}>
          <div className="flex text-2xl">
            {post.content}
          </div>
        </Link>
      </div>
    </div>
  );
}