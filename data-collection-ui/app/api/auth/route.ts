import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Handle authentication errors
    if (error) {
      console.error("Auth error:", error.message);
      return NextResponse.json(
        { error: "Authentication error", message: error.message },
        { status: 401 }
      );
    }

    // Check if user is logged in
    if (user) {
      return NextResponse.json(
        {
          authenticated: true,
          userId: user.id,
          email: user.email,
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        authenticated: false,
        userId: null,
      },
      { status: 401 }
    );
  } catch (err) {
    console.error("Unexpected error checking authentication:", err);
    return NextResponse.json(
      {
        error: "Server error",
        message: "Failed to check authentication status",
      },
      { status: 500 }
    );
  }
};
