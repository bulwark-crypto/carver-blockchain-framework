FROM node:11

LABEL description="reservation"

RUN npm init -y
RUN npx tsc

EXPOSE 3001

CMD /usr/sbin/nginx -g 'daemon off;'