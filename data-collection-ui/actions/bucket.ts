"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * @bucketName: string - The name of the bucket to create
 * @publicAccess: boolean - Whether the bucket should be public or private
 * @allowedMimeTypes: string[] | null - An array of allowed MIME types for the bucket, Keep null for any type
 * @fileSizeLimit: number | null - The maximum file size allowed in the bucket (in bytes or using units like 'MB', 'GB'). Keep null for default limit.
 * @description: This function creates a new bucket in Supabase storage with the specified name, access level, allowed MIME types, and file size limit.
 * @returns: Promise<{ data: any; error: any }> - The response from Supabase
 */
export const createBucket = async ({
  bucketName,
  publicAccess,
  allowedMimeTypes,
  fileSizeLimit,
}: {
  bucketName: string;
  publicAccess: boolean;
  allowedMimeTypes: string[] | null;
  fileSizeLimit?: number | string | null;
}) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.createBucket(bucketName, {
    public: publicAccess,
    allowedMimeTypes: allowedMimeTypes,
    fileSizeLimit: fileSizeLimit,
  });

  return { data, error };
};

/**
 * @bucketName: string - The name of the bucket to retrieve details for.
 * @description: This function retrieves the details of a specific bucket.
 * @returns: Promise<{ data: Bucket | null; error: any }> - The bucket details or an error.
 */
export const getBucketDetails = async (bucketName: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.getBucket(bucketName);
  return { data, error };
};

/**
 * @description: This function lists all available buckets in the Supabase storage.
 * @returns: Promise<{ data: Bucket[] | null; error: any }> - An array of bucket details or an error.
 */
export const listAllBuckets = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.listBuckets();
  return { data, error };
};

/**
 * @bucketName: string - The name of the bucket to update.
 * @publicAccess: boolean - The new public access setting for the bucket.
 * @allowedMimeTypes: string[] | null - The new list of allowed MIME types.
 * @fileSizeLimit: number | string | null - The new file size limit.
 * @description: This function updates the properties of an existing bucket.
 * @returns: Promise<{ data: { message: string } | null; error: any }> - A success message or an error.
 */
export const updateBucketDetails = async ({
  bucketName,
  publicAccess,
  allowedMimeTypes,
  fileSizeLimit,
}: {
  bucketName: string;
  publicAccess: boolean;
  allowedMimeTypes: string[] | null;
  fileSizeLimit?: number | string | null;
}) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.updateBucket(bucketName, {
    public: publicAccess,
    allowedMimeTypes: allowedMimeTypes,
    fileSizeLimit: fileSizeLimit,
  });
  return { data, error };
};

/**
 * @bucketName: string - The name of the bucket to delete.
 * @description: This function deletes an existing bucket. Note: The bucket must be empty before deletion.
 * @returns: Promise<{ data: { message: string } | null; error: any }> - A success message or an error.
 */
export const deleteBucketById = async (bucketName: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.deleteBucket(bucketName);
  return { data, error };
};

/**
 * @bucketName: string - The name of the target bucket.
 * @filePath: string - The path within the bucket where the file should be uploaded (including the file name).
 * @file: File | Buffer | Blob - The file content to upload.
 * @cacheControl: string - The cache control header value (e.g., '3600' for 1 hour).
 * @upsert: boolean - If true, overwrites the file if it already exists. If false, returns an error if the file exists.
 * @description: This function uploads a file to the specified bucket and path.
 * @returns: Promise<{ data: { path: string; fullPath: string } | null; error: any }> - The path information of the uploaded file or an error.
 */
export const uploadFileToBucket = async ({
  bucketName,
  filePath,
  file,
  cacheControl = "3600",
  upsert = false,
}: {
  bucketName: string;
  filePath: string;
  file: File | Buffer | Blob;
  cacheControl?: string;
  upsert?: boolean;
}) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: cacheControl,
      upsert: upsert,
    });
  return { data, error };
};

/**
 * @bucketName: string - The name of the bucket containing the file.
 * @filePath: string - The path to the file within the bucket.
 * @description: This function downloads a file from the specified bucket and path.
 * @returns: Promise<{ data: Blob | null; error: any }> - The file content as a Blob or an error.
 */
export const downloadFileFromBucket = async ({
  bucketName,
  filePath,
}: {
  bucketName: string;
  filePath: string;
}) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);
  return { data, error };
};

/**
 * @bucketName: string - The name of the bucket to list files from.
 * @folderPath: string | undefined - The folder path within the bucket to list. Use undefined or '' for the root.
 * @limit: number - The maximum number of files to return.
 * @offset: number - The number of files to skip (for pagination).
 * @sortBy: { column: string; order: string } - The sorting criteria (e.g., { column: 'name', order: 'asc' }).
 * @description: This function lists files within a specific folder (or root) of a bucket.
 * @returns: Promise<{ data: FileObject[] | null; error: any }> - An array of file objects or an error.
 */
export const listFilesInBucket = async ({
  bucketName,
  folderPath,
  limit = 100,
  offset = 0,
  sortBy = { column: "name", order: "asc" },
}: {
  bucketName: string;
  folderPath?: string;
  limit?: number;
  offset?: number;
  sortBy?: { column: string; order: string };
}) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(folderPath, {
      limit: limit,
      offset: offset,
      sortBy: sortBy,
    });
  return { data, error };
};

/**
 * @bucketName: string - The name of the bucket containing the files.
 * @filePaths: string[] - An array of file paths to remove.
 * @description: This function removes one or more files from the specified bucket.
 * @returns: Promise<{ data: FileObject[] | null; error: any }> - An array of the removed file objects (usually empty on success) or an error.
 */
export const removeFilesFromBucket = async ({
  bucketName,
  filePaths,
}: {
  bucketName: string;
  filePaths: string[];
}) => {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);
  return { data, error };
};
