import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { LoadingPage } from "~/components/loading";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";

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
        <div>Profile View</div>
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
