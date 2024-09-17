import { CiImageOn } from "react-icons/ci";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const CreatePost = ({ feedType }) => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const imgRef = useRef(null);

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();

  const {
    mutate: createPost,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ text, img }) => {
      try {
        const res = await fetch("/api/posts/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, img }),
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
      setText("");
      setImg(null);

      queryClient.invalidateQueries({ queryKey: ["posts" + feedType] });
      toast.success("Post created successfully", {
        position: "bottom-center",
        className: "bg-gray-500 text-white text-sm",
        iconTheme: {
          primary: "#212e31",
          secondary: "#fff",
        },
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPost({ text, img });
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex px-4 pt-8 items-start gap-4 border-b border-gray-700">
      <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>
        <div className="flex w-full gap-2">
          <div className="avatar">
            <div className="w-8 h-8 rounded-full">
              <img src={authUser.profileImg || "/avatar-placeholder.png"} />
            </div>
          </div>
          <textarea
            className="textarea w-full p-0 text-md resize-none border-none focus:outline-none border-gray-800"
            placeholder="What's on your mind?"
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
          />
          {!img && (
            <CiImageOn
              className="fill-primary w-6 h-6 cursor-pointer"
              onClick={() => imgRef.current.click()}
            />
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            ref={imgRef}
            onChange={handleImgChange}
          />
        </div>

        {img && (
          <div className="relative w-full mx-auto">
            <img
              src={img}
              className="w-full mx-auto h-72 object-contain rounded"
            />
            <IoCloseSharp
              className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
              onClick={() => {
                setImg(null);
                imgRef.current.value = null;
              }}
            />
          </div>
        )}
        {isError && <div className="text-red-500 text-sm">{error.message}</div>}
        <div className="flex flex-row-reverse border-t py-2 justify-items-end border-t-gray-700 w-full">
          <button className="btn btn-primary rounded btn-sm  text-white px-4">
            {isPending ? (
              <span className="loading loading-ring loading-sm"></span>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreatePost;
