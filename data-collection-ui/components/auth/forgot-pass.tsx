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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { motion } from "framer-motion";
import { contentVariants } from "@/constants/animate";

// Define the form schema with Zod
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

// Define the form type from the schema
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  // Initialize the form with default values and the zod resolver
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  function onSubmit(data: ForgotPasswordFormValues) {
    console.log("Reset password email sent to:", data.email);
    // In a real app, you would send a reset link to the user's email
    alert(`Reset link sent to ${data.email}`);
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
              Send Reset Link
              <ArrowRight className="ml-2 h-4 w-4" />
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
