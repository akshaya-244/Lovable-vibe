// import { inngest } from "./client"
// import { createAgent, createTool, openai } from '@inngest/agent-kit'
// import Sandbox from "@e2b/code-interpreter"
// import { getSandbox } from "./utils";
import {z} from 'zod'

import { inngest } from "./client";
import Sandbox from "@e2b/code-interpreter";
import {openai, createAgent, createTool, createNetwork} from "@inngest/agent-kit";
import { getSandbox, lastAssistantTextMessageContent } from './utils';
import { PROMPT } from '../prompt';
// export const helloWorld = inngest.createFunction(
//     { id: "hello-world" },
//     { event: "test/hello.world" },
//     async ({ event, step }) => {

//         const sandboxId = await step.run("get-sandbox-id", async () => {
//             const sandbox = await Sandbox.create("vibe-lovable-2")
//             return sandbox.sandboxId
//         })
//         const SummarizerAgent = createAgent({
//             name: 'Code writer',
//             system: 'You are an expert code writer in React, Typescript. Write efficient components for the questions presented to you',
//             model: openai({model: 'gpt-5-nano'}),
//             tools: [
//                 createTool({
//                     name: "terminal",
//                     description: "Use the terminal to run commands",
//                     parameters: z.object({
//                         command: z.string(),
//                     }),
//                     handler: async ({command}, {step}) => {
//                         return await step?.run("terminal", async () => {
//                             const buffers = { stdout: "", stderr: ""};
//                             try{
//                                 const sandbox = await getSandbox(sandboxId);
//                                 const result = await sandbox.commands.run(command, {
//                                     onStdout: (data: string) => {
//                                         buffers.stdout += data;
    
//                                     },
//                                     onStderr:(data: string) => {
//                                         buffers.stderr += data;
//                                     }
//                                 });
//                                 return result.stdout;
//                             }
//                             catch(e){
//                                 console.log(
//                                     `Code Failed: ${e} \n stdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
//                                 )
//                             }
//                         }) 
//                         }
                       
                        
//                 })
//             ]
//         });
        
//         const {output}  = await SummarizerAgent.run(event.data.value)
//         const sandboxUrl = await step.run("get-sandbox-url", async () => {
//             const sandbox = await getSandbox(sandboxId)
//             const host = sandbox.getHost(3000);
//             return `https://${host}`
//         })
//         return { output, sandboxUrl };
//     },
// );


export const helloWorld = inngest.createFunction(
    { id: "hello-world"},
    { event: "test/hello.world" },
    async ({event, step}) => {
        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("vibe-lovable-2")
            return sandbox.sandboxId;
        });

        const codeAgent = createAgent({
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
                        { step, network }
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
                        if (typeof newFiles === "object")
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
        const network = createNetwork({
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
        // const {output}  = await codeAgent.run(event.data.value)
        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId)
            const host = sandbox.getHost(3000);
            return `https://${host}`
        })
        return { 
            url: sandboxUrl ,
            title: "Fragment",
            files: result.state.data.files,
            summary: result.state.data.summary, 
        };
    }
)