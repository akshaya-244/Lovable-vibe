import { inngest } from "./client"
import { createAgent, openai } from '@inngest/agent-kit'
import Sandbox from "@e2b/code-interpreter"
import { getSandbox } from "./utils";
export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {

        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create("vibe-lovable-2")
            return sandbox.sandboxId
        })
        const SummarizerAgent = createAgent({
            name: 'Code writer',
            system: 'You are an expert code writer in React, Typescript. Write efficient components for the questions presented to you',
            model: openai({model: 'gpt-5-nano'})
        });
        
        const {output}  = await SummarizerAgent.run(event.data.value)
        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId)
            const host = sandbox.getHost(3000);
            return `https://${host}`
        })
        return { output, sandboxUrl };
    },
);


