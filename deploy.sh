
#!/usr/bin/env bash

set -Eeuo pipefail

# ============================================================
# Configuration
# ============================================================

DOMAIN="pizzapidrizza.shop"
WWW_DOMAIN="www.pizzapidrizza.shop"

WEB_ROOT="/var/www/html/pizza-pi-drizza"
SITE_SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/pizza-pi-drizza"

NGINX_CONFIG="/etc/nginx/sites-available/pizza-pi-drizza"
NGINX_ENABLED="/etc/nginx/sites-enabled/pizza-pi-drizza"

LETSENCRYPT_WEBROOT="/var/www/letsencrypt"

CERT_NAME="$DOMAIN"

# Set CERTBOT_EMAIL environment variable before execution
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

# ============================================================
# Helpers
# ============================================================

log() {
    echo -e "\n[INFO] $1"
}

error() {
    echo -e "\n[ERROR] $1" >&2
    exit 1
}

check_root() {
    [[ "$EUID" -eq 0 ]] || error "Run this script as root (sudo)."
}

check_source() {
    [[ -d "$SITE_SOURCE" ]] || error "Site directory not found: $SITE_SOURCE"
    [[ -f "$SITE_SOURCE/index.html" ]] || error "index.html not found in $SITE_SOURCE"
}

check_email() {
    if [[ -z "$CERTBOT_EMAIL" ]]; then
        read -rp "Enter email for Let's Encrypt: " CERTBOT_EMAIL
    fi

    [[ -n "$CERTBOT_EMAIL" ]] || error "Email is required."
}

# ============================================================
# Install packages
# ============================================================

install_packages() {
    log "Installing Nginx, Certbot and dependencies"

    apt-get update

    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        nginx \
        certbot \
        rsync

    systemctl enable nginx
    systemctl start nginx
}

# ============================================================
# Deploy website
# ============================================================

deploy_site() {
    log "Deploying website"

    mkdir -p "$WEB_ROOT"

    # Sync files from Git repository
    # --delete removes files that no longer exist in source
    rsync -av --delete "$SITE_SOURCE/" "$WEB_ROOT/"

    chown -R www-data:www-data "$WEB_ROOT"

    find "$WEB_ROOT" -type d -exec chmod 755 {} \;
    find "$WEB_ROOT" -type f -exec chmod 644 {} \;
}

# ============================================================
# Configure Nginx HTTP
# ============================================================

configure_nginx_http() {
    log "Configuring Nginx HTTP virtual host"

    mkdir -p "$LETSENCRYPT_WEBROOT"

    # Disable default Nginx site
    rm -f /etc/nginx/sites-enabled/default

    # Remove previous configuration symlink if necessary
    ln -sfn "$NGINX_CONFIG" "$NGINX_ENABLED"

    cat > "$NGINX_CONFIG" <<EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN $WWW_DOMAIN;

    root $WEB_ROOT;
    index index.html;

    # Let's Encrypt ACME challenge
    location ^~ /.well-known/acme-challenge/ {
        root $LETSENCRYPT_WEBROOT;
        default_type text/plain;
    }

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~ /\. {
        deny all;
    }
}
EOF

    nginx -t
    systemctl reload nginx
}

# ============================================================
# Obtain SSL certificate
# ============================================================

obtain_certificate() {
    log "Obtaining Let's Encrypt certificate"

    certbot certonly \
        --webroot \
        --webroot-path "$LETSENCRYPT_WEBROOT" \
        --cert-name "$CERT_NAME" \
        -d "$DOMAIN" \
        -d "$WWW_DOMAIN" \
        --email "$CERTBOT_EMAIL" \
        --agree-tos \
        --non-interactive
}

# ============================================================
# Configure Nginx HTTPS + HTTP/2
# ============================================================

configure_nginx_https() {
    log "Configuring HTTPS and HTTP/2"

    local NGINX_VERSION

    NGINX_VERSION="$(nginx -v 2>&1 | sed -E 's|.*/||')"

    local HTTP2_DIRECTIVE

    # Nginx 1.25.1+ uses "http2 on;"
    # Older versions use "listen ... ssl http2;"
    if dpkg --compare-versions "$NGINX_VERSION" ge "1.25.1"; then
        HTTP2_DIRECTIVE="http2 on;"
        HTTPS_LISTEN="listen 443 ssl;"
        HTTPS_LISTEN_IPV6="listen [::]:443 ssl;"
    else
        HTTP2_DIRECTIVE=""
        HTTPS_LISTEN="listen 443 ssl http2;"
        HTTPS_LISTEN_IPV6="listen [::]:443 ssl http2;"
    fi

    cat > "$NGINX_CONFIG" <<EOF
# HTTP -> HTTPS
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN $WWW_DOMAIN;

    location ^~ /.well-known/acme-challenge/ {
        root $LETSENCRYPT_WEBROOT;
        default_type text/plain;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS
server {
    $HTTPS_LISTEN
    $HTTPS_LISTEN_IPV6

    $HTTP2_DIRECTIVE

    server_name $DOMAIN $WWW_DOMAIN;

    root $WEB_ROOT;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/$CERT_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$CERT_NAME/privkey.pem;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~ /\. {
        deny all;
    }
}
EOF

    nginx -t
    systemctl reload nginx

    log "Nginx version: $NGINX_VERSION"
}

# ============================================================
# Configure certificate auto-renewal
# ============================================================

configure_certbot() {
    log "Configuring certificate auto-renewal"

    systemctl enable certbot.timer
    systemctl start certbot.timer

    certbot renew --dry-run
}

# ============================================================
# Main
# ============================================================

main() {
    check_root
    check_source
    check_email

    install_packages
    deploy_site
    configure_nginx_http
    obtain_certificate
    configure_nginx_https
    configure_certbot

    log "Deployment completed successfully!"

    echo ""
    echo "Website: https://$DOMAIN"
    echo "HTTP/2: enabled"
    echo "SSL: Let's Encrypt"
}

main "$@"
