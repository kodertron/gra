FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN yarn install

# Copy project files
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# Run the development server
CMD ["yarn", "start", "--host"]