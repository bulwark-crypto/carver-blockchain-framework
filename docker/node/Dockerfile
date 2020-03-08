FROM node:11

LABEL description="node"

RUN npm init -y
RUN npx tsc

EXPOSE 3001

CMD /usr/sbin/nginx -g 'daemon off;'