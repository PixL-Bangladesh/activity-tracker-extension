import { createClient } from "@/utils/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

export const GET = async (
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ userId: string }>;
  }
) => {
  try {
    const supabase = await createClient();
    const { userId } = await params;

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("task_statuses")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      console.error("Error fetching task statuses:", error);
      return NextResponse.json(
        { error: "Error loading task data" },
        { status: 500 }
      );
    }

    const taskStatuses = profile?.task_statuses || {};
    const inProgressTasksId = Object.keys(taskStatuses).filter(
      (taskId) => taskStatuses[taskId] === "in-progress"
    );

    return NextResponse.json(
      {
        inProgressTasksId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching in-progress tasks:", error);
    return NextResponse.json(
      { error: "Error loading in-progress tasks" },
      { status: 500 }
    );
  }
};
