// components/input/index.tsx
"use client";

import { KeyboardEvent, useContext, useRef, useState } from "react";
import axios from "axios";
import { AppContext } from "@/contexts/AppContext";
import { Cover } from "@/types/cover";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function () {
  const router = useRouter();
  const { setCovers, user, fetchUserInfo } = useContext(AppContext);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInputKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Enter" && !e.shiftKey) {
      if (e.keyCode !== 229) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认提交行为
    if (!description) {
      toast.error("请输入红包封面描述");
      inputRef.current?.focus();
      return;
    }

    if (!user) {
      toast.error("请先登录");
      router.push("/sign-in");
      return;
    }

    if (user.credits && user.credits.left_credits < 1) {
      toast.error("余额不足，请先充值");
      router.push("/pricing");
      return;
    }

    try {
      const params = {
        description: description,
        file_id: fileId, // 包含 file_id
      };
      setLoading(true);
      console.log("params", params);
      const resp = await fetch("/api/protected/gen-wallpaper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      const { code, message, data } = await resp.json();
      setLoading(false);

      if (resp.status === 401) {
        toast.error("请先登录");
        router.push("/sign-in");
        return;
      }
      console.log("gen wallpaper resp", resp);

      if (code !== 0) {
        toast.error(message);
        return;
      }

      fetchUserInfo();
      setDescription("");
      setImage(null);
      setImagePreview(null);
      setFileId(null); // 重置 file_id

      toast.success("生成成功");
      if (data) {
        console.log("new cover", data);
        setCovers((covers: Cover[]) => [data, ...covers]);
      }
    } catch (e) {
      console.log("gen cover failed", e);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("仅支持 JPG 和 PNG 格式的图片");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));

      // 上传文件到 MinIO 并获取 file_id
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('/api/upload-to-minio', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setFileId(response.data.data.file_id);
      } catch (error) {
        console.error('Error uploading file to MinIO:', error);
        toast.error('文件上传失败');
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("仅支持 JPG 和 PNG 格式的图片");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));

      // 上传文件到 MinIO 并获取 file_id
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post('/api/upload-to-minio', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setFileId(response.data.data.file_id);
      } catch (error) {
        console.error('Error uploading file to MinIO:', error);
        toast.error('文件上传失败');
      }
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setFileId(null);
  };

  return (
    <div className="relative max-w-2xl mx-auto mt-4 md:mt-16">
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              图片描述
            </label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={6}
              placeholder="请输入您想要生成的图片描述..."
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              参考图片(可选)
            </label>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                dragActive ? "border-indigo-500" : "border-gray-300"
              } border-dashed rounded-md ${dragActive ? "bg-indigo-100" : ""}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto h-32 w-32 object-cover rounded-md"
                    />
                    <button
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      onClick={handleRemoveImage}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4v8m0 0l4 4m-4-4a4 4 0 00-5.656 0L12 28m0 0l-4-4"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>上传图片</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/jpeg, image/png"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">或拖拽图片到此处</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? "生成中..." : "生成图片"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
