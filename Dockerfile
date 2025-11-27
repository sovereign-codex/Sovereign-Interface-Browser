# Sovereign Interface Browser – container image
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
RUN npm install --only=production
ENV NODE_ENV=production
EXPOSE 5173
CMD ["npm", "run", "start"]
