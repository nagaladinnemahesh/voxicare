#nodejs 20 alpine for small image
FROM node:20-alpine

WORKDIR /app

#copy root package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/

#install all dependencies
RUN npm install --workspace=server

#copy prisma schema
COPY apps/server/prisma ./apps/server/prisma

#generate prisma client
RUN cd apps/server && npx prisma generate

#copy server source
COPY apps/server ./apps/server

#expose port 
EXPOSE 3001

#start with ts-node
CMD ["sh", "-c", "cd apps/server && npx prisma migrate deploy && npm run dev"]