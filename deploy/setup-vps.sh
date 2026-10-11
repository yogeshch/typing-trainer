#!/usr/bin/env bash
set -e

echo "=== VPS Setup for Typing Trainer ==="

# Configure swap if not already present
if [ ! -f /swapfile ]; then
  echo "Creating 2GB swapfile..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swapfile created and enabled."
else
  echo "Swapfile already exists, skipping."
fi

# Set swappiness
sysctl vm.swappiness=10
if ! grep -q 'vm.swappiness=10' /etc/sysctl.conf; then
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

echo "=== VPS Setup Complete ==="
