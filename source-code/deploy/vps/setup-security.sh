#!/usr/bin/env bash
set -euo pipefail

SSH_PORT="${SSH_PORT:-}"
if [[ -z "${SSH_PORT}" ]]; then
  SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port / { print $2; exit }' || true)"
fi
SSH_PORT="${SSH_PORT:-22}"

apt update
apt install -y ufw fail2ban

ufw default deny incoming
ufw default allow outgoing
ufw limit "${SSH_PORT}/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/alrawi-sshd.local <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
logpath = %(sshd_log)s
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo "Fail2ban status:"
systemctl status fail2ban --no-pager || true
echo
echo "UFW status:"
ufw status verbose
