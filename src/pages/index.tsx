import { useState } from "react";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { toast } from "react-hot-toast";
import Link from "next/link";

import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

const CreatePostWizard = () => {
  const { user } = useUser();

  // we don't need to do useState<string>('') because we're passing in a string which makes the type known
  const [input, setInput] = useState("");

  // grab context of entire trpc cache
  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      // void tells typescript not to care about the synchronisity of this action
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post. Invalid post or frequency error");
      }
    },
  });

  if (!user) return null;

  console.log("user", user);

  return (
    <div className="flex w-full gap-3">
      <Image
        height={14}
        width={14}
        className="h-14 w-14 rounded-full"
        src={user.profileImageUrl}
        alt="Profile Image"
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none disabled:opacity-50"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            mutate({ content: input });
          }
        }}
      />
      {input !== "" && !isPosting && (
        <button
          className="disabled:opacity-50"
          onClick={() => mutate({ content: input })}
        >
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

// tRPC trick for fetching type from the router output function
// type PostWithUser = RouterOutputs["posts"]["getAll"][number];

// const PostView = (props: PostWithUser) => {
//   const { post, author } = props;

//   return (
//     <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
//       <img
//         height={14}
//         width={14}
//         className="h-14 w-14 rounded-full"
//         src={author.profileImageUrl}
//         alt="Author Image"
//       />
//       <div className="flex flex-col text-slate-300">
//         <div>
//           <Link href={`/@${author.username}`}>
//             <span>{`@${author.username}`}</span>
//           </Link>
//           <Link href={`/post/${post.id}`}>
//             <span className="font-thin">{` · ${dayjs(
//               post.createdAt
//             ).fromNow()}`}</span>
//           </Link>
//         </div>
//         <span className="text-xl">{post.content}</span>
//       </div>
//     </div>
//   );
// };

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Error fetching data...</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        // direct prop dump, cool
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // start fetching ASAP (react query will handle the nitty gritty)
  api.posts.getAll.useQuery();

  if (!userLoaded) return <LoadingPage />;

  return (
    <PageLayout>
      <div className="border-b border-slate-400 p-4">
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton />
          </div>
        )}
        {!!isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
};

export default Home;
