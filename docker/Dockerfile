# Tooling image: tests (Node), static server (Python), icon/OG rendering (librsvg + ImageMagick).
# Everything that runs project scripts goes through this image via the justfile.
FROM node:22-alpine

RUN apk add --no-cache \
      python3 \
      librsvg \
      rsvg-convert \
      imagemagick \
      font-dejavu \
      fontconfig \
    && fc-cache -f

WORKDIR /app
