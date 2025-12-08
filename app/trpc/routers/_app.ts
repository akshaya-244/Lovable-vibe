import { messageRouter } from '@/app/modules/messages/server/proceedure';
import { createTRPCRouter } from '../init';
import { projeRouter } from '@/app/modules/projects/server/proceedure';
export const appRouter = createTRPCRouter({
  messages: messageRouter,
  projects: projeRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;