FROM node:20-alpine AS build
WORKDIR /src
COPY . .
RUN node build.js

FROM nginx:alpine
COPY --from=build /src/index.html /usr/share/nginx/html/index.html
COPY --from=build /src/styles.css /usr/share/nginx/html/styles.css
COPY --from=build /src/docs       /usr/share/nginx/html/docs
EXPOSE 80
