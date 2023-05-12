FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN apk update
RUN apk add curl
RUN apk add --no-cache --upgrade bash
RUN chmod u+x startCMD.sh

RUN apk add --no-cache aws-cli
RUN aws --version

#PORTS------------------------------

EXPOSE 80
#EXPOSE 22
#EXPOSE 443

#PORTS------------------------------

ENTRYPOINT [ "/bin/bash" ]
