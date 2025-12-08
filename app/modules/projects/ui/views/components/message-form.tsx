import { useForm } from "react-hook-form"
import {z } from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import { Form, FormField } from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon, Loader2Icon } from "lucide-react"
import { useTRPC } from "@/app/trpc/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { err } from "inngest/types"
interface MessageFormProps{
    projectId: string
}

const formSchema = z.object({
    value: z.string()
        .min(1, {message: "Value is required"})
        .max(10000, {message: "Value is too long"})
})
export const MessageForm = ({projectId}: MessageFormProps) => {
    const [isFocussed, setIsFocussed] = useState(false)
    const showUsage = false;
    const trpc = useTRPC()
    const queryClient= useQueryClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        }
    })

    const createMessage = useMutation(trpc.messages.create.mutationOptions(
        {onSuccess: (data) => {
            form.reset();
            queryClient.invalidateQueries(
                trpc.messages.getMany.queryOptions({projectId}),
            );

        },
        onError: (error) => {
            toast.error(error.message);
        }}
    ))
    const isPending = createMessage.isPending
    const isDisabled = isPending || !form.formState.isValid
    
  
    const onSubmit = async(values: z.infer<typeof formSchema>) => {
        //mutateAsync returns a promise that resolves or rejects. returns voids
        await createMessage.mutateAsync({
            value: values.value,
            projectId:projectId
        })
    }
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}
            className={cn("  relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                isFocussed && "shadow-xs",
                showUsage && "rounded-t-none"
            )}>
                <div className="flex">
                <FormField
                    control={form.control} 
                    name="value"
                    render={({field}) => (
                        <TextareaAutosize 
                            {...field}
                            disabled={isPending}
                            onFocus= {() => setIsFocussed(true)}
                            onBlur = {() => setIsFocussed(false)}
                            minRows={2}
                            maxRows={8}
                            className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                            placeholder="What would you like to build?"
                            onKeyDown={(e) =>{
                                if(e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    form.handleSubmit(onSubmit)(e);
                                }
                            }}
                        />
                    )}
                    />
                    
                    {/* <Button className="rounded-xl" ><ArrowBigUp /></Button> */}
                </div>
                {/* <div className="flex text-xs text-mono text-foreground ">
                    <span className="pointer-events-none bg-muted  rounded-md border-2 p-2">
                        &#8984; Enter
                    </span>
                    <span>
                        to submit
                    </span>
                </div > */}
                <div className="flex gap-x-2 items-end justify-between pt-2">
                        <div className="text-[10px] text-muted-foreground font-mono">
                            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium ">
                                <span>&#8984;</span> Enter
                            </kbd>
                            &nbsp; to submit
                        </div>
                    <Button disabled={isDisabled} className={cn(
                        "size-8 rounded-full",
                        isDisabled && "bg-muted-foreground border"
                    )}>
                        {isPending 
                        ? <Loader2Icon className=" size-4 animate-spin" /> 
                        :  <ArrowUpIcon size={8} />}
                       
                    </Button>
                </div>
                
            </form>
            
        </Form>
    )
}