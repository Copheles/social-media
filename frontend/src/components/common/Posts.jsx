import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

const Posts = ({ feedType, username, userId }) => {
  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/posts/all";
      case "following":
        return "/api/posts/following";
      case "posts":
        return `/api/posts/user/${username}`;
      case "likes":
        return `/api/posts/likes/${userId}`;
      default:
        return "/api/posts/all";
    }
  };

  const { ref, inView } = useInView();

  const POST_ENDPOINT = getPostEndpoint();

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const res = await fetch(POST_ENDPOINT + `?page=${pageParam}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    getNextPageParam: (lastPage) => {
      const isFetch =
        lastPage.page <= lastPage.pages ? lastPage.page + 1 : null;
      return isFetch;
    },
  });

  useEffect(() => {
    if ((inView && hasNextPage)) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage]);

  useEffect(() => {
    refetch();
  }, [feedType, refetch, username]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && data?.pages[0].posts?.length === 0 && (
        <p className="text-center my-4 text-gray-400">
          No posts in this tab. Switch 👻
        </p>
      )}
      {!isLoading && !isRefetching && data.pages[0].posts && (
        <div>
          {data?.pages.map((page) => {
            return (
              <div key={page.page}>
                {page.posts.map((post) => (
                  <Post key={post._id} post={post} />
                ))}
              </div>
            );
          })}
        </div>
      )}
      <div ref={ref} className="flex justify-center items-center my-5">
        {isFetchingNextPage && (
          <span className="loading loading-dots loading-md"></span>
        )}
      </div>
    </>
  );
};
export default Posts;
