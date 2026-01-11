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

# Copy setup script into the container
COPY setup-shell.sh /usr/local/bin/setup-shell.sh
RUN chmod +x /usr/local/bin/setup-shell.sh
