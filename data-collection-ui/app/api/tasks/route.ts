import { uploadFileToBucket } from "@/actions/bucket";
import { insertUploadDataToTaskTable } from "@/actions/tasks";
import type { TaskEventBucketType } from "@/types/tasks";
import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  api: {
    responseLimit: false,
  },
};

export const POST = async (request: NextRequest) => {
  try {
    const sessionData = (await request.json()) as TaskEventBucketType;
    if (!sessionData) {
      return NextResponse.json("No data provided", { status: 400 });
    }

    const newBlob = new Blob([JSON.stringify(sessionData)], {
      type: "application/json",
    });

    const uploadData = await uploadFileToBucket({
      bucketName: "recordings",
      filePath: `${sessionData.userId}/${sessionData.taskId}.json`,
      file: newBlob,
    });

    if (uploadData.error) {
      console.error("Error uploading file:", uploadData.error);
      return NextResponse.json("Error uploading file", {
        status: 500,
      });
    }
    const { data } = uploadData;
    if (!data) {
      return NextResponse.json("No data returned from upload", { status: 500 });
    }

    const inserted = await insertUploadDataToTaskTable({
      userId: sessionData.userId,
      taskId: data.id,
      path: data.path,
      fullPath: data.fullPath,
    });

    if (!inserted) {
      return NextResponse.json("Error inserting data into task table", {
        status: 500,
      });
    }

    const supabase = await createClient();
    const { data: taskStatuses, error } = await supabase
      .from("user_profiles")
      .select("task_statuses")
      .eq("id", sessionData.userId)
      .single();

    if (error) {
      console.error("Error fetching task statuses:", error);
      return NextResponse.json("Error fetching task statuses", {
        status: 500,
      });
    }

    if (!taskStatuses) {
      return NextResponse.json("No task statuses found", { status: 404 });
    }

    const taskStatusesObject = taskStatuses.task_statuses as Record<
      string,
      string
    >;
    const taskId = sessionData.taskId;
    const taskStatus = "completed";

    taskStatusesObject[taskId] = taskStatus;
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ task_statuses: taskStatusesObject })
      .eq("id", sessionData.userId);

    if (updateError) {
      console.error("Error updating task status:", updateError);
      return NextResponse.json("Error updating task status", { status: 500 });
    }

    return NextResponse.json({
      message: "File uploaded and data inserted successfully",
      fileId: data.id,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json("Invalid JSON format", { status: 400 });
  }
};
