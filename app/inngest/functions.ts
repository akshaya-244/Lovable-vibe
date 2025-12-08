// import { inngest } from "./client"
// import { createAgent, createTool, openai } from '@inngest/agent-kit'
// import Sandbox from "@e2b/code-interpreter"
// import { getSandbox } from "./utils";
import {z} from 'zod'

import { inngest } from "./client";
import Sandbox from "@e2b/code-interpreter";
import {openai, createAgent, createTool, createNetwork, type Tool} from "@inngest/agent-kit";
import { getSandbox, lastAssistantTextMessageContent } from './utils';
import { PROMPT } from '../prompt';
import { prisma } from '@/lib/db';

interface AgentState{
    summary: string,
    files: {[path: string]: string};
}

export const codeAgentFunction = inngest.createFunction(
    { id: "code-agent"},
    { event: "code-agent/run" },
    async ({event, step}) => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("vibe-lovable-2")
            return sandbox.sandboxId;
        });

        const codeAgent = createAgent<AgentState>({
            name: "code-agent",
            description: "An expert coding agent",
            system: PROMPT,
            model: openai({
                model: "gpt-5",
                //slight randomness in defaultParameters
      
            }),

            tools: [
                createTool({
                    name: "terminal",
                    description: "Use the terminal to run commands",
                    parameters: z.object({
                        command: z.string(),
                    }),
                    handler: async ({command}, {step}) => {
                        return step?.run("terminal", async () => {
                            const buffers = {stdout: "", stderr: ""};
                            try{
                                const sandbox  = await getSandbox(sandboxId);
                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data: string) => {
                                        buffers.stdout += data;

                                    },
                                    onStderr: (data: string) => {
                                        buffers.stderr += data;
                                    }
                                });
                                return result.stdout;
                            }
                            catch(e){
                                console.error(
                                    `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`
                                );
                                return  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`
                            }
                        })
                    },
                    
                }),
                createTool({
                    name: "createOrUpdateFiles",
                    description: "Create or update files in the sandbox",
                    parameters: z.object({
                        files: z.array(
                            z.object({
                                path:z.string(),
                                content: z.string(),
                            }),
                        ),
                    }),
                    handler: async (
                        { files },
                        { step, network }: Tool.Options<AgentState>
                    ) => {
                        const newFiles = await step?.run("createOrUpdateFiles", async () => {
                            try{
                                //keeping track of files changed so we can show it to the user later
                                //Why cant u write a seperate prompt so Ai can keep track because it ll have to 
                                const updatedFiles = network.state.data.files || {};
                                const sandbox = getSandbox(sandboxId);
                                for (const file of files) {
                                    (await sandbox).files.write(file.path, file.content);
                                    updatedFiles[file.path]= file.content;
                                }
                                return updatedFiles;
                            }
                            catch(e){
                                console.error(`Error: ${e}`)
                            }
                        });
                        // Success is an object (updatedFiles) and Error is a string so if updatedFile return succeds update the network by adding the new changed files
                        if (newFiles && typeof newFiles === "object")
                                network.state.data.files = newFiles
                    }
                }),
                createTool({
                    name: "readFiles",
                    description: "Read files from the sandbox",
                    parameters: z.object({
                        files: z.array(z.string())
                    }),
                    handler: async ({files}, {step}) => {
                        return await step?.run("readFiles", async() => {
                            try{
                                const sandbox = await getSandbox(sandboxId)
                                const contents = [];
                                for(const file of files) {
                                    const content = await sandbox.files.read(file);
                                    contents.push({path:file, content})

                                }
                                return JSON.stringify(contents);
                            }
                            catch(e){
                                return "Error: "+ e;
                            }
                        })
                    }
                })
            ],
            //tells you when to stop looping. The AI has access to all the tools equally and it can keep looping forever so we have
            //written in prompt.ts that after u have finished coding come up with a <task_summary></task_summary> that is when you have to end the loop
            lifecycle: {
                onResponse: async ({result, network}) => {
                    const lastAssistantMessageText = lastAssistantTextMessageContent(result);

                    if(lastAssistantMessageText && network) {
                        if(lastAssistantMessageText.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantMessageText;
                        }
                    }
                    return result;
                }

            }
        })


        const network = createNetwork<AgentState>({
            name: "coding-agent-network",
            agents: [codeAgent],
            maxIter: 15,
            router: async ({network}) => {
                const summary = network.state.data.summary;
                if(summary) {
                    return;
                }
                //Code Agent will be called many times till a summary is detected.
                return codeAgent;
            }
        })


        const result = await network.run(event.data.value);

        const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;
        // const {output}  = await codeAgent.run(event.data.value)
        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId)
            const host = sandbox.getHost(3000);
            return `https://${host}`
        })

        await step.run("save-result", async () => {
            if(isError) {
                return await prisma .message.create({
                    data: {
                        project: event.data.projectId,
                        content: "Something went wrong. Please try again",
                        role: "ASSISTANT",
                        type: "ERROR"
                    }
                })
            }
            return await prisma.message.create({
                data: {
                    projectId: event.data.projectId,
                    content: result.state.data.summary,
                    role: "ASSISTANT",
                    type: "RESULT",
                    fragment: {
                        create: {
                            sandboxUrl: sandboxUrl,
                            title: "Fragment",
                            files: result.state.data.files,
                        },
                    },
                },
            })
        })

        
        return { 
            url: sandboxUrl ,
            title: "Fragment",
            files: result.state.data.files,
            summary: result.state.data.summary, 
        };
    }
)