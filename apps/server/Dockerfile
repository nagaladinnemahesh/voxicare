FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/

RUN npm install --workspace=server

COPY apps/server/prisma ./apps/server/prisma

RUN cd apps/server && npx prisma generate

COPY apps/server ./apps/server

EXPOSE 3001

CMD ["sh", "-c", "cd apps/server && npx prisma migrate deploy && npm run dev"]