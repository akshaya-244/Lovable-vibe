import { baseProcedure, createTRPCRouter } from "@/app/trpc/init";
import {includes, z} from "zod"; 
import {prisma} from "@/lib/db"
import { inngest } from "@/app/inngest/client";

export const messageRouter = createTRPCRouter({
    getMany: baseProcedure
    .input(
        z.object({
            projectId: z.string()
            .min(1, {message: "Id is required"})
        })
    )
   
    .query( async ({input}) => {
        const messages = await prisma.message.findMany({
            where: {
                projectId: input.projectId
            },
            include: {
                fragment: true
            },
            orderBy:{
                updatedAt: "asc"
            }
        })
        return messages;
    }),

    create: baseProcedure
    .input(
        z.object({
            value: z.string()
            .min(1, {message: "Message is required"})
            .max(10000, {message: "Message is too long"}),
            projectId: z.string().min(1, {message: "Message is required"})

        })
    )
    .mutation(async ({input}) => {
        const createdMessage = await prisma.message.create({
            data: {
                content: input.value,
                projectId: input.projectId,
                role: "USER",
                type: "RESULT",
            },
        })
        await inngest.send({
            name: "code-agent/run",
            data: {
                projectId: input.projectId,
                value: input.value
            }
        });
        return createdMessage
    })
})