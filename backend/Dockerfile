FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 py3-pip

COPY package*.json ./
RUN npm install --omit=dev

COPY requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

COPY ai ./ai
COPY src ./src

EXPOSE 3001

CMD ["node", "src/server.js"]
