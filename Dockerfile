FROM node:13 as build

RUN mkdir -p /opt/build;

WORKDIR /opt/build

COPY ./src ./src
COPY ./contracts ./contracts
COPY [ "package.json", "yarn.lock", "tsconfig.json", "tsoa.json", "./" ]

RUN mkdir build;

RUN yarn install --no-progress && yarn build



FROM node:13 as dependencies

ENV NODE_ENV='production'

RUN mkdir -p /opt/build;

WORKDIR /opt/build
COPY --from=build [ "/opt/build/package.json", "/opt/build/yarn.lock", "./" ]
RUN yarn install --production=true --no-progress



FROM node:13-slim as release

ENV NODE_ENV='production'

RUN mkdir -p /opt/app;

WORKDIR /opt/app

COPY --from=dependencies /opt/build/node_modules /opt/app/node_modules
COPY --from=build /opt/build/build /opt/app/build
COPY --from=build /opt/build/contracts /opt/app/contracts

WORKDIR /opt/app

ENTRYPOINT [ "node", "build/src/server.js" ]
