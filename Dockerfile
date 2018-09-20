FROM node:10-alpine

ARG NPM_TOKEN

ENV PORT 3000
ENV NODE_ENV production

WORKDIR /home/node/app

COPY package*.json ./
COPY .npmrc ./

RUN npm set progress=false && \
    npm config set depth 0 && \
    npm install --only=production --loglevel=warn && \
    npm cache clean --force --loglevel=silent

COPY . .

RUN rm -f .npmrc
ENV PATH=$PATH:/home/node/app/node_modules/.bin

USER node

EXPOSE 3000

ENTRYPOINT [ "sh", "-c" ]
CMD [ "rejoice  -p . -c ./manifest/${NODE_ENV:-production}.json" ]
