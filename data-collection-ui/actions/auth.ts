"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import type {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
} from "@supabase/supabase-js";

type AuthData = {
  email: string;
  password: string;
  fullName?: string;
  rememberMe?: boolean;
};

export async function login(authData: AuthData) {
  const supabase = await createClient();

  const data: SignInWithPasswordCredentials = {
    email: authData.email,
    password: authData.password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (process.env.NEXT_PUBLIC_NODE_ENV === "development") {
    console.log("Login error:", error);
  }

  if (error) {
    redirect("/error");
  }

  const existingUser = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", authData.email)
    .limit(1)
    .single();

  if (!existingUser.data) {
    const name = (await supabase.auth.getUser()).data.user?.user_metadata
      .fullName as string;
    const { error } = await supabase.from("user_profiles").insert({
      email: authData.email,
      fullName: name,
    });

    if (error) {
      await supabase.auth.signOut();
      redirect("/error");
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(authData: AuthData) {
  const supabase = await createClient();

  const data: SignUpWithPasswordCredentials = {
    email: authData.email,
    password: authData.password,
    options: {
      data: {
        fullName: authData.fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth?tab=login`,
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/auth");
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (process.env.NEXT_PUBLIC_NODE_ENV === "development") {
    console.log("Logout error:", error);
  }

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPassword(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth?tab=login`,
  });

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/auth?tab=login");
}
