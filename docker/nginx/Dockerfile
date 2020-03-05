FROM debian:stretch-backports

LABEL description="Nginx nchan server"

RUN apt-get update && apt-get -y upgrade && apt-get -y install nginx-extras libnginx-mod-nchan

EXPOSE 80

CMD /usr/sbin/nginx -g 'daemon off;'