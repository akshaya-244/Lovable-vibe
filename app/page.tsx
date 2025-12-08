"use client";
import { Button } from "@/components/ui/button";
import { useTRPC } from "./trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  // const trpc = useTRPC()
  // //useQuery runs the query
  // const {data} = useQuery(trpc.hello.queryOptions({text: "Atonoa"}))
  const router = useRouter()
  const [value, setValue]=useState('');
  const trpc = useTRPC()
  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onSuccess: (data) => {
      router.push(`/projects/${data.id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    }
  }))
  return (
    <div className="flex min-h-screen text-black items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Input value={value} onChange={(e) => setValue(e.target.value)}/>
     <Button disabled={createProject.isPending} onClick={() => createProject.mutate({value:value})}> Submit </Button>
    </div>
  );
}
