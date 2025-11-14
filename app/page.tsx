"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTRPC } from "./trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Home() {
  // const trpc = useTRPC()
  // //useQuery runs the query
  // const {data} = useQuery(trpc.hello.queryOptions({text: "Atonoa"}))

  const trpc = useTRPC()
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: () => {
      toast.success("Background job running")
    }
  }))
  return (
    <div className="flex min-h-screen text-black items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     <Button disabled={invoke.isPending} onClick={() => invoke.mutate({text:"John"})}> Invoke Background job </Button>
    </div>
  );
}
