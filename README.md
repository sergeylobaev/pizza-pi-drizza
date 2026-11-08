Запуск деплоя
```
sudo ./deploy.sh
```

Тесты после деплоя
```
nginx -t
systemctl status nginx
systemctl status certbot.timer
certbot certificates
```

Тест HTTP2
```
curl -I --http2 https://pizzapidrizza.shop
```
