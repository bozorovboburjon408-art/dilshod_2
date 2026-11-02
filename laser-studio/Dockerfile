# docker build -t laser-studio . && docker run -p 4173:4173 laser-studio
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV PORT=4173
COPY --from=build /app/dist ./dist
COPY server ./server
USER node
EXPOSE 4173
CMD ["node", "server/index.mjs"]
