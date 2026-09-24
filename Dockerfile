FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
# .template (not conf.d/default.conf directly): the official nginx image's
# entrypoint runs envsubst on every file here at container start, writing the
# result to /etc/nginx/conf.d/, substituting BACKEND_URL for the value in
# compose.yaml's environment: block. It only substitutes variables that
# actually exist in the environment, so nginx's own runtime variables
# ($host, $remote_addr, etc., not real env vars) are left untouched — this
# is the documented, standard behavior of that image, not something bespoke
# here. Needed so a standalone `docker compose up` (test_backend running
# separately, reached via BACKEND_URL) doesn't require rebuilding the image
# just to point at a different backend.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80