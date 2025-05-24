import { createClient } from "@/utils/supabase/server";

export const insertUploadDataToTaskTable = async ({
  taskId,
  userId,
  path,
  fullPath,
}: {
  taskId: string;
  userId: string;
  path: string;
  fullPath: string;
}): Promise<boolean> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      fileId: taskId,
      userId,
      path,
      fullPath,
    })
    .select();

  if (error) {
    console.error("Error inserting data:", error);
    return false;
  }

  if (!data) {
    console.error("No data returned from insert");
    return false;
  }

  return true;
};
