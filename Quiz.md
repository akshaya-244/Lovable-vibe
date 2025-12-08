## Deep-Dive Quiz Questions

1. **End-to-end flow**: Describe, in detail, what happens from the moment a user types into the input on the home page and clicks the “Invoke Background job” button in `page.tsx` until the Inngest function returns its final response object. Include how tRPC, Inngest, the E2B sandbox, and the network lifecycle interact in this flow.


Answer: Once the user hits the Invoke Background Job button, it hits my backend which in turn hits inngest's backend.
This backend creates a agent with gpt-5 as its model and has access to 3 tools: terminal, createOrUpdateFiles, readFiles. There is a network state that is created which runs the codeAgent with the user;s prompt. It has a maximum of 15 iterations after which it has to stop. The agent will make a plan and call the appropriate tools to create what the user wants. These tools first creates and then connects to the cloud computer provided by E2B sandbox. This is where the code runs. There is a system prompt provided with a set of rules and guidelines to follow. The agent is instructed to create a <task_summary> when it has finished coding so that the lifecycle can end. If the task_summary is not generated it will loop till 15 iterations and stop. At the end a sandbox url is generated to view the output, task  summary, files and title are also returned.
tRPC is just a wrapper that makes calling a function running in a remote server easy. It makes it look like a simple function call
2. **Inngest + tRPC integration**: Explain how the `invoke` mutation in `app/trpc/routers/_app.ts` is wired to trigger the `helloWorld` Inngest function. Why is the event name `"test/hello.world"` important, and how is it used across the tRPC router and the Inngest function definition?

3. **Sandbox lifecycle**: In `app/inngest/functions.ts`, walk through how the sandbox is created, reused, and accessed via `Sandbox.create` and `getSandbox`. Why is `sandboxId` captured outside of the tool handlers, and what implications does that have for tool invocations during the agent run?

4. **Agent tools and file tracking**: Analyze how the `createOrUpdateFiles` tool is implemented. How does it use `network.state.data.files` to track file changes, and what are the consequences (good and bad) of storing full file contents in the agent network state?

5. **Prompt design and constraints**: The `PROMPT` string in `app/prompt.ts` encodes a large set of behavioral and safety constraints for the “code-agent”. Pick three specific constraints (e.g., how file paths must be specified, how Tailwind and Shadcn must be used, or which commands must never be run) and explain why each is necessary in the context of a sandboxed Next.js code-writing agent.

6. **Stopping condition and summaries**: How does the combination of `lastAssistantTextMessageContent` in `app/inngest/utils.ts`, the `lifecycle.onResponse` hook, and the network router in `app/inngest/functions.ts` ensure that the agent eventually stops iterating? Describe exactly where and how the `<task_summary>` content is detected, stored, and used to terminate the network.

7. **Tool usage vs. prompt rules**: The `readFiles` tool in `app/inngest/functions.ts` allows the agent to inspect files in the sandbox, while the prompt explicitly forbids using the `@` alias in filesystem operations and requires absolute paths like `/home/user/...`. Explain how a well-behaved agent should reconcile these instructions when deciding what paths to pass into `readFiles`.

8. **Error handling in tools**: Compare the error handling strategies used in the `terminal` and `createOrUpdateFiles` tools in `app/inngest/functions.ts`. How do they communicate failures back to the agent (or fail to), and what impact might this have on the agent’s ability to recover from or reason about errors?

9. **Serialization and data safety**: In `app/trpc/init.ts`, `superjson` is configured as the data transformer. Explain why a transformer like `superjson` is useful in a tRPC + Next.js setup, and give concrete examples of data types or scenarios in this project where using `superjson` is safer or more convenient than relying on plain JSON serialization.

10. **Client-side tRPC usage**: In `app/page.tsx`, analyze how `useTRPC`, `useMutation`, and the `invoke` mutation options are used together. Why is `toast.success` wired into `onSuccess` instead of being called directly after `mutate`, and how does the `isPending` flag affect the UX and correctness of the “Invoke Background job” button?

11. **Context and identity**: The tRPC context created in `app/trpc/init.ts` always returns `{ userId: 'user_123' }`. Suppose you wanted to extend this to support real per-request user identity in a production app. Based on the current design, explain where and how you would modify the code (both server and client) to support a real authenticated user, while still preserving the Inngest integration.

12. **Next.js layout and providers**: Describe the role of `TRPCReactProvider` and `Toaster` in `app/layout.tsx`. Why are these placed in the root layout instead of in `page.tsx`, and how does this choice affect the behavior and structure of the application, especially as you add more pages and tRPC procedures?

13. **Network configuration and iteration limits**: The `createNetwork` call in `app/inngest/functions.ts` sets `maxIter: 15`. Explain how this interacts with the router’s logic that checks for a `summary` in `network.state.data`. What happens if the agent never emits a `<task_summary>` but still has remaining iterations, and what trade-offs are involved in picking this iteration limit?



