import { useTRPC } from "@/app/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"
import { MessageCard } from "./message-card"
import { MessageForm } from "./message-form"
import { useEffect, useRef } from "react"

interface Props{
    projectId: string
}



export const MessageContainer = ({projectId}: Props) => {
    const trpc=useTRPC()
    const {data: messages} = useSuspenseQuery(trpc.messages.getMany.queryOptions({
        projectId
    }))
    //so that when you open this page you can see the latest message of the assistant.
    const bottomRef= useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lastAssistantMessage = messages.findLast(
            (message) => message.role === "ASSISTANT",
        );
        if (lastAssistantMessage){

        }
    },[messages])

    useEffect(() => {
        bottomRef.current?.scrollIntoView();
    },[messages.length])
    return (
        <div className=" flex flex-col flex-1 min-h-0"> 
            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="pt-2 pr-1">
                    {messages.map((message) => (
                        <MessageCard 
                            key={message.id}
                            content={message.content}
                            role={message.role}
                            fragment={message.fragment}
                            createdAt={message.createdAt}
                            isActiveFragment={false}
                            onFragmentClick={()=>{}}
                            type={message.type}
                        />
                    ))}
                    <div ref={bottomRef}/>
                </div>
            </div>
            <div className="relative p-3 pt-1">
                <MessageForm projectId={projectId} /><div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background/70 pointer-events-none"/>
            </div>
        </div>
    )
}