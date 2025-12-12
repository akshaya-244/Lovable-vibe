import Image from "next/image";
import { useEffect, useState } from "react"


const ShimmerMessages = () => {
    const messages = [
        "Thinking...",
        "Loading...",
        "Generating...",
        "Analysing your request...",
        "Building your website...",
        "Crafting components...",
        "Optimising Layout...",
        "Adding Final Touches...",
        "Almost Ready..."
    ]
    const [messageCurrentIndex, setMessageCurrentIndex] = useState(0);

    useEffect(() => {
        const interval=setInterval(() => {
            setMessageCurrentIndex((prev) => (prev+1) % messages.length)

        }, 2000)
        //If the component unmounts we want to clear the interval and start from the beginning next time
        return () => {
            clearInterval(interval)
        }
    }, [messages.length])
    //rerun only if messages.length changes which it wont as we have fixed it.

    return (
        <div className="flex items-center gap-2">
            <span className="text-base text-muted-foreground animate-pulse">
                {messages[messageCurrentIndex]}
            </span>
        </div>
    )
}

export const MessageLoading = () => {
    return(
        <div className="flex flex-col group px-2 pb-2">
            <div className="flex items-center gap-2 pl-2 mb-2">
                <Image 
                src="/logo.svg"
                alt="Vibe"
                height={18}
                width={18}
                className=""/>
                <span className="text-sm font-medium">
                    Vibe
                </span>
            </div>
            <div className="pl-8.5 flex flex-col gap-y-4">
                <ShimmerMessages />
            </div>
        </div>
    )

}

