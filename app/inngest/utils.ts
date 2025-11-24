import Sandbox from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";

export async function getSandbox(sandboxId: string)  {
    const sandbox = await Sandbox.connect(sandboxId)
    return sandbox;
}

export function lastAssistantTextMessageContent(result: AgentResult) {
    //find the last message of the LM and extract the message and return it
    const lastAssistantTextMessageIndex = result.output.findLastIndex(
        (message) => message.role === "assistant",
    );

    const message = result.output[lastAssistantTextMessageIndex] as 
    | TextMessage
    | undefined;

    return message?.content
        ? typeof message.content === "string"
         ? message.content
         //can either be a string or an array of string
         : message.content.map((c) => c.text).join("")
        : undefined;
}