FROM node:22-slim

#Install curl
#apt-get is cli tool for interacting with the Advanced PAckage Tool system.
#apt-get clean clears the local cache of downloaded package files that are no longer needed.
RUN apt-get update && apt-get install -y curl ca-certificates && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

#Install dependencies and customise the sandbox
WORKDIR /home/user/nextjs-app

#Since in a sandbox we cant interact with it when asked questions, you answer prior by saying --yes to installs.
# . means install in the current folder
RUN npm config set strict-ssl false
RUN npx --yes create-next-app@latest . --yes
RUN npm install -D tailwindcss postcss autoprefixer next react react-dom typescript @types/node @types/react @types/react-dom
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx --yes shadcn@latest init --yes -b neutral --force
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx --yes shadcn@latest add --all --yes
#move the nextjs app into the user folder so the ai can access it easily and delete the files in the old folder. Nextjs requires an empty folder to create app
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app