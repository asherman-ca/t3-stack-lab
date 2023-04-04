import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <img
        height={14}
        width={14}
        className="h-14 w-14 rounded-full"
        src={author.profileImageUrl}
        alt="Author Image"
      />
      <div className="flex flex-col text-slate-300">
        <div>
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` · ${dayjs(
              post.createdAt
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};
