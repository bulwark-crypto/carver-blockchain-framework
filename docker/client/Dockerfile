FROM node:11

LABEL description="client"
WORKDIR /usr/src/service

RUN npm install
RUN npx tsc

EXPOSE 3000

CMD /usr/sbin/nginx -g 'daemon off;'