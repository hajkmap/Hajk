FROM nginx
#RUN rm /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/

EXPOSE 1337

CMD ["nginx", "-g", "daemon off;"]