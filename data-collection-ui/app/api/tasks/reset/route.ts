import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { listFilesInBucket, removeFilesFromBucket } from "@/actions/bucket";
import { removeUploadDataFromTaskTable } from "@/actions/tasks";

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body (optional - you could also use the user ID from auth)
    const body = await request.json();
    const { bucketName = "recordings" } = body;

    const userId = user.id;

    // Remove files from bucket
    // List files in the folder
    const { data, error } = await listFilesInBucket({
      bucketName,
      folderPath: userId,
    });

    if (error) {
      console.error("Error listing files in bucket:", error);
      return NextResponse.json(
        { error: "Failed to list files in bucket" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log("No files found in the bucket for the user.");
    } else {
      // Delete each file
      const { data: deleteData, error: deleteError } =
        await removeFilesFromBucket({
          bucketName,
          filePaths: data.map((file) => `${userId}/${file.name}`),
        });

      if (deleteError) {
        console.error("Error deleting files from bucket:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete files from bucket" },
          { status: 500 }
        );
      }
    }

    // Remove data from tasks table
    const removeDataResult = await removeUploadDataFromTaskTable({
      taskId: userId,
      userId,
      allRows: true,
    });

    if (!removeDataResult) {
      console.error("Error removing data from tasks table");
      return NextResponse.json(
        { error: "Failed to remove data from tasks table" },
        { status: 500 }
      );
    }

    // Reset task status
    const { error: taskError } = await supabase
      .from("user_profiles")
      .update({
        task_statuses: {},
      })
      .eq("id", userId);

    if (taskError) {
      console.error("Error resetting task statuses:", taskError);
      return NextResponse.json(
        { error: "Failed to reset task statuses" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Progress reset successfully",
        userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reset progress API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
