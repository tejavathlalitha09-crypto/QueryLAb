"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Terminal, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  fullName: z.string().min(2, "Name required").max(80),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type Form = z.infer<typeof schema>;

export default function SignupPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: Form) => {
    const supabase = createClient();
    if (!supabase) {
      push("error", "Supabase is not configured. Create an account after connecting Supabase.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName } },
    });
    setLoading(false);
    if (error) {
      push("error", error.message);
      return;
    }
    push("success", "Account created. Check your email to confirm.");
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 text-center">
          <Terminal className="mx-auto h-8 w-8 text-primary mb-2" />
          <h1 className="text-xl font-bold">Create your QueryLab account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Save queries, track history, and sync across devices.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
            <Input id="fullName" autoComplete="name" placeholder="Ada Lovelace" {...register("fullName")} className="mt-1" />
            {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} className="mt-1" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register("password")} className="mt-1" />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : <><UserPlus className="h-4 w-4" /> Sign up</>}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
