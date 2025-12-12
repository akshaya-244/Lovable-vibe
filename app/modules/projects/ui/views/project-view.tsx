"use client";
import { useTRPC } from "@/app/trpc/client";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useSuspenseQuery } from "@tanstack/react-query"
import { Suspense, useState } from "react";
import { MessageContainer } from "./components/message-container";
import { Fragment } from "@/generated/prisma/client";
import { ProjectHeader } from "./components/project-header";

interface Props{
    projectId: string
}
export const ProjectView = ({projectId}: Props) => {
    const trpc=useTRPC()
  
    const {data: project} = useSuspenseQuery(trpc.projects.getOne.queryOptions({
        id: projectId
    }))
    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null) 
    return(
        <div className="h-screen">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col min-h-0">
                    <Suspense fallback={<p>Loading Projects</p>}></Suspense>
                    <ProjectHeader projectId={projectId}/>
                    <Suspense fallback={<p>Loading Messages...</p>}>
                        <MessageContainer 
                        projectId={projectId}
                        activeFragment={activeFragment}
                        setActiveFragment = {setActiveFragment}
                         />
                    </Suspense>
                </ResizablePanel >
                <ResizableHandle withHandle/>
                <ResizablePanel defaultSize={65} minSize={50}>
                {JSON.stringify(project)}
                   
                </ResizablePanel>
            </ResizablePanelGroup>

        </div>
    )
}