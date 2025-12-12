import { useTRPC } from "@/app/trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"
import { MessageCard } from "./message-card"
import { MessageForm } from "./message-form"
import { useEffect, useRef } from "react"
import { Fragment } from "@/generated/prisma/client"
import { MessageLoading } from "./messages-loading"

interface Props{
    projectId: string
    activeFragment: Fragment | null;
    setActiveFragment: (fragment: Fragment | null )=> void;
}



export const MessageContainer = ({projectId , activeFragment, setActiveFragment}: Props) => {
    const trpc=useTRPC()
    const {data: messages} = useSuspenseQuery(trpc.messages.getMany.queryOptions({
        projectId
    },{
        refetchInterval:5000
    }))
    //so that when you open this page you can see the latest message of the assistant.
    const bottomRef= useRef<HTMLDivElement>(null);
    
    // useEffect(() => {
    //     const lastAssistantMessage = messages.findLast(
    //         (message) => message.role === "ASSISTANT",
    //     );
    //     if (lastAssistantMessage){
    //         //TODO
    //         setActiveFragment(lastAssistantMessage.fragment)
    //     }
    // },[messages, setActiveFragment])

    useEffect(() => {
        bottomRef.current?.scrollIntoView();
    },[messages.length])
    const lastMessage = messages[messages.length-1];
    const isLastMessage = lastMessage.role === "USER"
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
                            isActiveFragment={message.fragment?.id === activeFragment?.id  }
                            onFragmentClick={()=>{setActiveFragment(message.fragment)}}
                            type={message.type}
                        />
                    ))}
                    {isLastMessage && <MessageLoading />}
                    <div ref={bottomRef}/>
                </div>
            </div>
            <div className="relative p-3 pt-1">
                <MessageForm projectId={projectId} /><div className="absolute -top-6 left-0 right-0 h-6 bg-linear-to-b from-transparent to-background/70 pointer-events-none"/>
            </div>
        </div>
    )
}