import React from "react";
import { TabsContent } from "../ui/tabs";
import { ArrowRight, Mail } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { motion } from "framer-motion";
import { contentVariants } from "@/constants/animate";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// Define the form schema with Zod
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// Define the form type from the schema
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = ({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) => {
  const supabase = createClient();
  const [loading, setLoading] = React.useState(false);

  // Initialize the form with default values and the zod resolver
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: ForgotPasswordFormValues) {
    setLoading(true);
    const { email } = data;

    // Call the Supabase function to send the reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Error sending reset email:", error);
      toast.error(
        `Failed to send reset link: ${error.message || "Unknown error"}`
      );
    } else {
      setLoading(false);
      console.log("Reset email sent successfully");
      toast.success(
        "A reset link has been sent to your email address. Please check your inbox."
      );
      setActiveTab("login");
    }
  }

  return (
    <TabsContent value="forgot-password" className="mt-0 outline-none">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={contentVariants}
        key="forgot-password-form"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>

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
            </div>

            <Button type="submit" className="w-full">
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="loader"></span> Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Send Reset Link
                  <ArrowRight className="mr-2 h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        </Form>
      </motion.div>
    </TabsContent>
  );
};

export default ForgotPassword;
