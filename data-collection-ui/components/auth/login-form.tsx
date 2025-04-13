import { Lock, Mail, EyeOff, Eye, ArrowRight } from "lucide-react";
import React, { useState } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { TabsContent } from "../ui/tabs";
import { Label } from "../ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { contentVariants } from "@/constants/animate";
import { login } from "@/actions/auth";
import { toast } from "sonner";

// Define the form schema with Zod
const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }),
  rememberMe: z.boolean().optional(),
});

// Define the form type from the schema
type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize the form with default values and the zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Handle form submission
  async function onSubmit(data: LoginFormValues) {
    try {
      setLoading(true);
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast.error(message, {
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <TabsContent value="login" className="mt-0 outline-none">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={contentVariants}
        key="login-form"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        className="pl-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground"
                    onClick={() => form.setValue("rememberMe", !field.value)}
                  >
                    Remember me
                  </Label>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              {loading ? (
                "Loging in..."
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="w-full">
              <FaGoogle className="h-5 w-5 mr-2" />
              Google
            </Button>
            <Button variant="outline" type="button" className="w-full">
              <FaFacebook className="h-5 w-5 mr-2" />
              Facebook
            </Button>
          </div>
        </div>
      </motion.div>
    </TabsContent>
  );
};

export default LoginForm;
