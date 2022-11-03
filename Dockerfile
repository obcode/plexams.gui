FROM node:19-alpine

# install dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copy all local files into the image.
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "./build"]