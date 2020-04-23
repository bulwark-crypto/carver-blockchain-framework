FROM node:11

LABEL description="node"
WORKDIR /usr/src/service

RUN npm install
RUN npx tsc

EXPOSE 3001

# For ebugging
EXPOSE 9229

CMD /usr/sbin/nginx -g 'daemon off;'