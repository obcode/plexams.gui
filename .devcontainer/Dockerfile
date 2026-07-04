FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Ensure UTF-8 locales are available and set by default
RUN apt-get update \
    && apt-get install -y --no-install-recommends locales \
    && sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && sed -i 's/# de_DE.UTF-8 UTF-8/de_DE.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales \
    && update-locale LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# pnpm via Corepack aktivieren (als root, damit die Shims für den node-User
# verfügbar sind). Die konkrete pnpm-Version kommt aus dem "packageManager"-Feld
# der package.json. Der Prompt zum Download der Version wird unterdrückt.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Copy setup script into the container
COPY setup-shell.sh /usr/local/bin/setup-shell.sh
RUN chmod +x /usr/local/bin/setup-shell.sh
