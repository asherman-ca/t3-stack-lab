import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { LoadingPage } from "~/components/loading";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import Image from "next/image";
import { PostView } from "~/components/postview";

const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
    userId: props.userId,
  });

  if (isLoading) return <LoadingPage />;
  if (!data || data.length === 0) return <div>User has not posted</div>;

  console.log(data);
  return (
    <div className="flex flex-col">
      {/* {data.map((post) => (
        <PostView key={post.id} post={...post} />
      ))} */}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });

  // because the props are loading statically there is no more clientside loading state
  // if (isLoading) {
  //   return <LoadingPage />;
  // }
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-48 border-b border-slate-400 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            alt={"profile image"}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-black"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="border-b border-slate-400 p-4 text-2xl font-bold">{`@${
          data.username ?? ""
        }`}</div>
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  // fetch ahead of time and hydrate through server side props (static?)
  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

// paths will generate as they're called at request time
export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default ProfilePage;
