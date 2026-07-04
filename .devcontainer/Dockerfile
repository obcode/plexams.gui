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

# --- Playwright (Chromium) für e2e-/Browser-Tests ---
# Chromium samt Systemabhängigkeiten (libnss3, libatk, … via apt) schon ins Image
# backen, damit `pnpm test:e2e` bzw. Browser-Tests ohne per-Create-Download und
# ohne Netz laufen. Installation als root nach /ms-playwright (world-readable),
# PLAYWRIGHT_BROWSERS_PATH zeigt dorthin, sodass das später per pnpm installierte
# @playwright/test denselben Browser findet.
# WICHTIG: Version mit @playwright/test in der package.json synchron halten —
# passt der Browser-Build nicht zur Projekt-Version, verlangt Playwright einen
# Neu-Download. Bei einem Bump hier UND in der package.json anheben.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx --yes playwright@1.61.1 install --with-deps chromium \
    && chmod -R a+rX /ms-playwright \
    && rm -rf /var/lib/apt/lists/*

# Copy setup script into the container
COPY setup-shell.sh /usr/local/bin/setup-shell.sh
RUN chmod +x /usr/local/bin/setup-shell.sh
