#!/usr/bin/env bash
set -euo pipefail

TARGET_USER="${DEVCONTAINER_USER:-${USERNAME:-node}}"
HOME_DIR="$(getent passwd "$TARGET_USER" | cut -d: -f6)"

echo "Installing Starship if missing..."
ADD_LOCAL_BIN_TO_PATH=0
if ! command -v starship >/dev/null 2>&1; then
  if [ "$(id -u)" -eq 0 ]; then
    curl -fsSL https://starship.rs/install.sh | sh -s -- -y -b /usr/local/bin
  else
    mkdir -p "$HOME_DIR/.local/bin"
    curl -fsSL https://starship.rs/install.sh | sh -s -- -y -b "$HOME_DIR/.local/bin"
    ADD_LOCAL_BIN_TO_PATH=1
  fi
fi

echo "Copying Starship config..."
WORKSPACE_DIR="${REMOTE_CONTAINERS_WORKSPACE_FOLDER:-$PWD}"
CONFIG_SRC="$WORKSPACE_DIR/starship.toml"

# Fallback to alternate workspaces path if applicable
if [ ! -f "$CONFIG_SRC" ]; then
  ALT_WS="/workspaces/$(basename "$WORKSPACE_DIR")/starship.toml"
  if [ -f "$ALT_WS" ]; then
    CONFIG_SRC="$ALT_WS"
  fi
fi

# Ensure config directory exists
mkdir -p "$HOME_DIR/.config"

if [ -f "$CONFIG_SRC" ]; then
  cp "$CONFIG_SRC" "$HOME_DIR/.config/starship.toml"
  if [ "$(id -u)" -eq 0 ]; then
    chown -R "$TARGET_USER":"$TARGET_USER" "$HOME_DIR/.config"
  fi
else
  echo "Warning: starship.toml not found in $WORKSPACE_DIR; skipping copy."
fi

echo "Ensuring zsh loads Starship..."
touch "$HOME_DIR/.zshrc"

# Ensure ~/.local/bin is on PATH if we installed there
if [ "$ADD_LOCAL_BIN_TO_PATH" -eq 1 ]; then
  if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$HOME_DIR/.zshrc"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME_DIR/.zshrc"
  fi
fi

if ! grep -q "STARSHIP_CONFIG=\"\$HOME/.config/starship.toml\"" "$HOME_DIR/.zshrc"; then
  echo 'export STARSHIP_CONFIG="$HOME/.config/starship.toml"' >> "$HOME_DIR/.zshrc"
fi

if ! grep -q "starship init zsh" "$HOME_DIR/.zshrc"; then
  echo 'eval "$(starship init zsh)"' >> "$HOME_DIR/.zshrc"
fi

echo "Setup complete!"
