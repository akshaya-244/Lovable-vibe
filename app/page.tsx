"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTRPC } from "./trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  // const trpc = useTRPC()
  // //useQuery runs the query
  // const {data} = useQuery(trpc.hello.queryOptions({text: "Atonoa"}))
  const [value, setValue]=useState('');
  const trpc = useTRPC()
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: () => {
      toast.success("Background job running")
    }
  }))
  return (
    <div className="flex min-h-screen text-black items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Input value={value} onChange={(e) => setValue(e.target.value)}/>
     <Button disabled={invoke.isPending} onClick={() => invoke.mutate({value:value})}> Invoke Background job </Button>
    </div>
  );
}
