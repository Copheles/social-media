import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { BsThreeDots } from "react-icons/bs";
import { MdPersonAddAlt1, MdPersonRemoveAlt1 } from "react-icons/md";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";
import useFollow from "../../hooks/useFollow";

const Post = ({ post, type }) => {
  const [comment, setComment] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { follow, isPending } = useFollow();

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();
  const postOwner = post.user;
  const isLiked = post?.likes.includes(authUser._id);
  const amIFollowing = authUser?.following.includes(post.user?._id);

  const isMyPost = authUser._id === post.user._id;

  const formattedDate = formatPostDate(post.createdAt);

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/${post._id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: (deletedPost) => {
      console.log("deleted Post id", deletedPost);
      toast.success("Post deleted successfully", {
        position: "bottom-center",
        className: "bg-gray-500 text-white text-sm",
        iconTheme: {
          primary: "#212e31",
          secondary: "#fff",
        },
      });
      // queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.setQueryData(["posts" + type], (oldData) => {
        const newPosts = oldData.pages.map((page) => {
          return {
            ...page,
            posts: page.posts.filter((p) => {
              return p._id !== deletedPost.id;
            }),
          };
        });
        return { pageParams: oldData.pageParams, pages: newPosts };
      });
    },
  });

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/like/${post._id}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: (updatedLikes) => {
      // this is not the best UX, bc it will refetch all posts
      // queryClient.invalidateQueries({ queryKey: ["posts"] });

      // instead, update the cache directly for that post
      queryClient.setQueryData(["posts" + type], (oldData) => {
        const newPosts = oldData.pages.map((page) => {
          return {
            ...page,
            posts: page.posts.map((p) => {
              if (p._id === post._id) {
                return { ...p, likes: updatedLikes };
              }
              return p;
            }),
          };
        });
        return { pageParams: oldData.pageParams, pages: newPosts };
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/comment/${post._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["posts" + type] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeletePost = () => {
    deletePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleItemClick = (action) => {
    action();
    setIsDropdownOpen(false); // Close the dropdown
  };

  return (
    <>
      <div className="flex gap-2 items-start p-4 border-b border-gray-700">
        <div className="flex flex-col flex-1">
          <div className="flex gap-2 items-center">
            <div className="avatar">
              <Link
                to={`/profile/${postOwner.username}`}
                className="w-8 h-8 rounded-full overflow-hidden "
              >
                <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
              </Link>
            </div>
            <Link
              to={`/profile/${postOwner.username}`}
              className="font-bold hover:text-gray-200"
            >
              {postOwner.fullName}
            </Link>
            <span className="text-gray-500 flex gap-1 text-xs md:text-sm">
              <Link to={`/profile/${postOwner.username}`}>
                @{postOwner.username}
              </Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>

            <div className="dropdown dropdown-bottom flex justify-end flex-1 ">
              <div
                tabIndex={0}
                className="border border-transparent hover:border-gray-700 rounded-full p-2"
                onClick={toggleDropdown}
              >
                <BsThreeDots />
              </div>
              {isDropdownOpen && (
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                  <li className="text-gray-300">
                    {!isMyPost &&
                      (amIFollowing ? (
                        <span
                          className="font-bold"
                          onClick={() =>
                            handleItemClick(() => follow(post.user._id))
                          }
                        >
                          {isPending ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <MdPersonRemoveAlt1 className="cursor-pointer" />
                          )}
                          UnFollow
                        </span>
                      ) : (
                        <span
                          className="font-bold"
                          onClick={() =>
                            handleItemClick(() => follow(post.user._id))
                          }
                        >
                          {isPending ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <MdPersonAddAlt1 className="cursor-pointer" />
                          )}
                          Follow
                        </span>
                      ))}
                  </li>
                  <li onClick={handleDeletePost} className="text-gray-300">
                    {isMyPost && (
                      <span className="font-bold">
                        {!isDeleting && (
                          <FaTrash className="cursor-pointer hover:text-red-500" />
                        )}
                        {isDeleting && <LoadingSpinner size="sm" />}
                        Delete
                      </span>
                    )}
                  </li>
                  {/* <li className="text-gray-300">
                  {isMyPost && (
                    <span>
                      {!isDeleting && (
                        <FaEdit className="cursor-pointer hover:text-red-500" />
                      )}
                      {isDeleting && <LoadingSpinner size="sm" />}
                      Edit
                    </span>
                  )}
                </li> */}
                </ul>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 overflow-hidden max-w-3xl ">
            <span className="mt-2 text-sm p-2 text-gray-200 font-normal w-full">
              {post.text}
            </span>
            {post.img && (
              <img
                src={post.img}
                className="h-80 object-contain rounded-lg border border-gray-700"
                alt=""
              />
            )}
          </div>
          <div className="flex justify-between mt-3">
            <div className="flex gap-4 items-center w-2/3 justify-between">
              <div
                className="flex gap-1 items-center cursor-pointer group"
                onClick={() =>
                  document
                    .getElementById("comments_modal" + post._id)
                    .showModal()
                }
              >
                <FaRegComment className="w-4 h-4  text-slate-500 group-hover:text-sky-400" />
                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                  {post.comments.length}
                </span>
              </div>
              {/* We're using Modal Component from DaisyUI */}
              <dialog
                id={`comments_modal${post._id}`}
                className="modal border-none outline-none"
              >
                <div className="modal-box rounded border border-gray-600">
                  <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                  <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                    {post.comments.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex gap-2 items-start">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img
                              src={
                                comment.user.profileImg ||
                                "/avatar-placeholder.png"
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">
                              {comment.user.fullName}
                            </span>
                            <span className="text-gray-700 text-sm">
                              @{comment.user.username}
                            </span>
                          </div>
                          <div className="text-sm">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                    onSubmit={handlePostComment}
                  >
                    <textarea
                      className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button className="btn btn-primary rounded btn-sm text-white px-4">
                      {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                    </button>
                  </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button className="outline-none">close</button>
                </form>
              </dialog>
              <div className="flex gap-1 items-center group cursor-pointer">
                <BiRepost className="w-6 h-6  text-slate-500 group-hover:text-green-500" />
                <span className="text-sm text-slate-500 group-hover:text-green-500">
                  0
                </span>
              </div>
              <div
                className="flex gap-1 items-center group cursor-pointer"
                onClick={handleLikePost}
              >
                {isLiking && <LoadingSpinner size="sm" />}
                {!isLiked && !isLiking && (
                  <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
                )}
                {isLiked && !isLiking && (
                  <FaRegHeart className="w-4 h-4 cursor-pointer text-pink-500 " />
                )}

                <span
                  className={`text-sm  group-hover:text-pink-500 ${
                    isLiked ? "text-pink-500" : "text-slate-500"
                  }`}
                >
                  {post.likes.length}
                </span>
              </div>
            </div>
            <div className="flex w-1/3 justify-end gap-2 items-center">
              <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Post;
