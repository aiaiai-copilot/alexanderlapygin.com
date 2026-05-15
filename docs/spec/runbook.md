# Runbook эксплуатации alexanderlapygin.com

Документ содержит **операционные процедуры**: конкретные команды, конфиги, пошаговые инструкции для первичной настройки и регулярных задач.

Связанные документы:
- [`spec.md`](./spec.md) — описание поведения и обязательств системы.
- [`decisions.md`](./decisions.md) — обоснования архитектурных решений.

## Содержание

1. Структура секретов и конфигурации (`.env`)
2. Первичная настройка VPS
3. DNS-записи
4. HTTPS-сертификат (certbot)
5. Конфигурация nginx
6. systemd unit и logrotate
7. Деплой и откат
8. Smoke-test
9. Регулярные задачи
10. Ротация секретов
11. Процедура обработки запросов субъекта ПДн
12. Реестр обработки ПДн (шаблон)
13. Регистрационные действия с Роскомнадзором
14. Транслитерация slug
15. Цели Метрики
16. CSP-директивы

---

## 1. Структура секретов и конфигурации (`.env`)

Файл `/var/www/alexanderlapygin/shared/.env` — права `0600`, владелец `appuser:appuser`.

Шаблон `.env.example` в репозитории:

```
# SMTP
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME="alexanderlapygin.com"

# Контакт автора (куда доставляются заявки)
RECIPIENT_EMAIL=

# Параметры обработчика
CONTACT_TIMEOUT_MS=10000
SMTP_TIMEOUT_MS=5000

# Аналитика (build-time, попадает в клиентский бандл)
PUBLIC_METRIKA_ID=

# Узел приложения (используется в OG-URL, canonical, sitemap)
SITE_URL=https://alexanderlapygin.com
```

Резервная копия `.env` — в 1Password (или аналоге). Восстанавливается при первичной настройке нового сервера.

---

## 2. Первичная настройка VPS

### 2.1. Создание VM у выбранного провайдера

**Выбранный провайдер:** _____________________ (зафиксировать при первичной настройке)

Возможные варианты — см. [`decisions.md`](./decisions.md) §1.6. Для российской аудитории без трансграничной передачи ПДн — российский провайдер (Yandex Cloud, Selectel, VKCloud, Timeweb Cloud, Beget, Cloud.ru). Для глобального охвата — зарубежный (Hetzner, DigitalOcean, AWS Lightsail и т. д.), но с подачей уведомления в Роскомнадзор по ст. 12 (§13.2 этого файла).

**Минимальные требования:**
- Ubuntu LTS (текущая или предыдущая поддерживаемая).
- 2 vCPU, 2 GB RAM, 20 GB SSD.
- Статический или резервированный публичный IPv4-адрес.
- SSH-доступ.

**Замечание про порт 25.** Исходящий TCP/25 заблокирован у большинства облачных провайдеров по умолчанию. Это не проблема — доставка идёт через SMTP relay на порте 465 или 587 (§3 этого файла, §5.7 в [`spec.md`](./spec.md)).

После создания VM — записать публичный IPv4 в DNS A-запись (§3.1) и продолжить настройку под root через SSH.

### 2.2. Системные учётные записи

```bash
# Под root:
adduser --system --group --home /var/www/alexanderlapygin appuser
adduser deploy
mkdir -p /var/www/alexanderlapygin/{releases,shared/logs,shared/failed}
chown -R appuser:appuser /var/www/alexanderlapygin
chmod 700 /var/www/alexanderlapygin/shared/failed
```

### 2.3. Установка пакетов

```bash
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx nodejs npm logrotate
# Проверка версии Node.js — нужна 22 LTS или выше
node --version
```

Если требуется новее — поставить через nodesource или nvm для системного пользователя.

### 2.4. SSH-доступ для деплоя

Сгенерировать SSH-ключ для GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
```

Публичный ключ → в `~deploy/.ssh/authorized_keys` на VPS. Приватный ключ → в GitHub Secrets как `DEPLOY_SSH_KEY`.

### 2.5. `sudoers` для `deploy`

`/etc/sudoers.d/deploy`:

```
deploy ALL=(root) NOPASSWD: /bin/ln -sfn * /var/www/alexanderlapygin/current
deploy ALL=(root) NOPASSWD: /bin/systemctl restart alexanderlapygin.service
deploy ALL=(root) NOPASSWD: /bin/systemctl status alexanderlapygin.service
```

### 2.6. Файервол

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 3. DNS-записи

Делегирование — у регистратора домена (или в Yandex Cloud DNS, если делегирован туда). Конкретные значения зависят от выбранного SMTP-провайдера.

### 3.1. Базовые записи

```
A     @     <публичный IP VPS>
A     www   <публичный IP VPS>   # альтернативно — CNAME на @
```

### 3.2. Email-аутентификация (пример для Yandex 360)

```
TXT   @           "v=spf1 redirect=_spf.yandex.net"
CNAME mail._domainkey   mail._domainkey.yandex.net.
TXT   _dmarc       "v=DMARC1; p=none; rua=mailto:<email>@<домен>; ruf=mailto:<email>@<домен>; adkim=r; aspf=r"
```

После 30 дней при чистых DMARC-отчётах — обновить:

```
TXT   _dmarc       "v=DMARC1; p=quarantine; pct=100; rua=mailto:..."
```

После ещё 60 дней — обновить:

```
TXT   _dmarc       "v=DMARC1; p=reject; rua=mailto:..."
```

### 3.3. Тестирование

После настройки SPF/DKIM — отправить тестовое письмо через `/api/contact` и проверить через mail-tester.com. Целевой score — 9+/10.

Если score < 9 — проверить:
- SPF: `dig TXT alexanderlapygin.com +short`
- DKIM: проверить наличие записи селектора провайдера
- DMARC: `dig TXT _dmarc.alexanderlapygin.com +short`

---

## 4. HTTPS-сертификат (certbot)

### 4.1. Основной путь — HTTP-01 challenge

Простейший вариант для одного домена без wildcard:

```bash
certbot --nginx -d alexanderlapygin.com -d www.alexanderlapygin.com \
  --email <admin-email> --agree-tos --no-eff-email
```

certbot автоматически модифицирует конфиг nginx и настраивает таймер автопродления.

Проверка автопродления:

```bash
certbot renew --dry-run
```

### 4.2. Альтернативный путь — DNS-01 через плагин провайдера DNS

Если понадобится wildcard или нельзя открывать 80-й порт. Выбор плагина зависит от того, **где делегирован домен** (это не обязательно тот же провайдер, что и хостинг VPS).

**Cloudflare** (официальный плагин, рекомендуется при делегировании туда):

```bash
apt install python3-certbot-dns-cloudflare
certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/.secrets/cloudflare.ini \
  -d alexanderlapygin.com -d '*.alexanderlapygin.com'
```

**Yandex Cloud DNS** (community-плагин, статус Alpha, без активных релизов с 2022):

```bash
pip install --break-system-packages certbot-dns-yandexcloud
certbot certonly --authenticator certbot-dns-yandexcloud \
  --certbot-dns-yandexcloud-credentials /etc/letsencrypt/.secrets/yc.ini \
  -d alexanderlapygin.com -d '*.alexanderlapygin.com'
```

Service account для Yandex Cloud DNS: `dns.editor` только на нужный folder.

**Другие провайдеры** (Selectel, DigitalOcean, Hetzner, регистраторы): поискать официальный плагин в certbot snap или PyPI. Если нативного плагина нет — использовать HTTP-01 (раздел 4.1) или универсальный `certbot-dns-multi` (поддерживает 100+ провайдеров через lego).

При поломке community-плагина — fallback на HTTP-01: временно открыть 80-й порт в файрволе, выпустить сертификат, закрыть.

---

## 5. Конфигурация nginx

`/etc/nginx/sites-available/alexanderlapygin.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=contact:10m rate=10r/m;

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name alexanderlapygin.com www.alexanderlapygin.com;

    ssl_certificate /etc/letsencrypt/live/alexanderlapygin.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alexanderlapygin.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    root /var/www/alexanderlapygin/current/dist/client;
    index index.html;

    # Заголовки безопасности
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()" always;
    # CSP — в разделе 16 этого документа
    add_header Content-Security-Policy "..." always;

    # Сжатие
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml+rss;
    # brotli — если собран модуль
    # brotli on;
    # brotli_types ...;

    # Кэширование
    location ~* \.(?:js|css|woff2?|avif|webp|png|jpg|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ $uri.html =404;
        add_header Cache-Control "no-cache";
    }

    # 404 страница
    error_page 404 = @notfound;
    location @notfound {
        if ($request_uri ~ ^/en/) {
            return 404 /en/404.html;
        }
        return 404 /404.html;
    }

    # API-эндпоинт
    location = /api/contact {
        limit_except POST {
            deny all;  # отдаёт 403, но nginx вернёт 405 при наличии POST в limit_except
        }
        limit_req zone=contact burst=5 nodelay;
        client_max_body_size 32k;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 12s;
    }
}

# HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name alexanderlapygin.com www.alexanderlapygin.com;
    return 301 https://alexanderlapygin.com$request_uri;
}
```

Активация:

```bash
ln -s /etc/nginx/sites-available/alexanderlapygin.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 6. systemd unit и logrotate

### 6.1. systemd unit

`/etc/systemd/system/alexanderlapygin.service`:

```ini
[Unit]
Description=alexanderlapygin.com SSR
After=network.target

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/var/www/alexanderlapygin/current
EnvironmentFile=/var/www/alexanderlapygin/shared/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node ./dist/server/entry.mjs
Restart=on-failure
RestartSec=5s
StartLimitBurst=5
StartLimitIntervalSec=60s
MemoryMax=256M

[Install]
WantedBy=multi-user.target
```

Активация:

```bash
systemctl daemon-reload
systemctl enable alexanderlapygin.service
systemctl start alexanderlapygin.service
systemctl status alexanderlapygin.service
```

### 6.2. logrotate

`/etc/logrotate.d/alexanderlapygin`:

```
/var/www/alexanderlapygin/shared/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 appuser appuser
    sharedscripts
    postrotate
        systemctl kill -s HUP alexanderlapygin.service > /dev/null 2>&1 || true
    endscript
}
```

Тестирование:

```bash
logrotate -d /etc/logrotate.d/alexanderlapygin   # dry-run
logrotate -f /etc/logrotate.d/alexanderlapygin   # принудительный прогон
```

### 6.3. systemd-tmpfiles для `shared/failed/`

`/etc/tmpfiles.d/alexanderlapygin.conf`:

```
# Type Path                                                Mode UID      GID      Age
d     /var/www/alexanderlapygin/shared/failed              0700 appuser  appuser  -
e     /var/www/alexanderlapygin/shared/failed              0700 appuser  appuser  90d
```

Активация / проверка:

```bash
systemd-tmpfiles --create /etc/tmpfiles.d/alexanderlapygin.conf
systemd-tmpfiles --clean /etc/tmpfiles.d/alexanderlapygin.conf
```

Автоматический запуск — через стандартный `systemd-tmpfiles-clean.timer` (включён в Ubuntu по умолчанию).

---

## 7. Деплой и откат

### 7.1. Структура каталогов

```
/var/www/alexanderlapygin/
├── current → releases/2026-05-15-1430/
├── releases/
│   ├── 2026-05-15-1430/
│   ├── 2026-05-10-0920/
│   └── ...   (не более 10)
└── shared/
    ├── .env       (0600, appuser)
    ├── logs/      (0750, appuser)
    └── failed/    (0700, appuser)
```

### 7.2. Шаги GitHub Actions деплоя

После сборки в CI:

```bash
# На раннере, под пользователем deploy:
TIMESTAMP=$(date +%Y-%m-%d-%H%M)
rsync -av --delete dist/ deploy@<vps>:/var/www/alexanderlapygin/releases/${TIMESTAMP}/
ssh deploy@<vps> "sudo ln -sfn /var/www/alexanderlapygin/releases/${TIMESTAMP} /var/www/alexanderlapygin/current"
ssh deploy@<vps> "sudo systemctl restart alexanderlapygin.service"

# Cleanup старых релизов:
ssh deploy@<vps> "cd /var/www/alexanderlapygin/releases && ls -t | tail -n +11 | xargs -r rm -rf"
```

### 7.3. Скрипт отката `scripts/rollback.sh`

На VPS, под `deploy`:

```bash
#!/bin/bash
set -e
RELEASES=/var/www/alexanderlapygin/releases
PREV=$(ls -t $RELEASES | sed -n '2p')
if [ -z "$PREV" ]; then
    echo "Нет предыдущего релиза для отката"
    exit 1
fi
sudo ln -sfn $RELEASES/$PREV /var/www/alexanderlapygin/current
sudo systemctl restart alexanderlapygin.service
echo "Откат на $PREV выполнен"
# Запуск smoke-test
./scripts/smoke-test.sh
```

Запуск через SSH или через отдельный GitHub Actions workflow с ручным триггером (workflow_dispatch).

---

## 8. Smoke-test

`scripts/smoke-test.sh`:

```bash
#!/bin/bash
set -e
BASE=https://alexanderlapygin.com

# Главная RU
curl -fsS -o /dev/null -w "%{http_code}\n" $BASE/ | grep -q 200

# Главная EN
curl -fsS -o /dev/null -w "%{http_code}\n" $BASE/en/ | grep -q 200

# 404
test $(curl -s -o /dev/null -w "%{http_code}" $BASE/__no_such_page__) = "404"

# API — GET должен вернуть 405
test $(curl -s -o /dev/null -w "%{http_code}" $BASE/api/contact) = "405"

echo "Smoke-test passed"
```

**Реальная отправка POST в smoke-test не выполняется** — см. [`decisions.md`](./decisions.md) §4.3.

---

## 9. Регулярные задачи

### 9.1. Еженедельная проверка `shared/failed/`

**Триггер:** ставится в личный календарь как повторяющаяся задача (раз в неделю, например, понедельник утро).

**Процедура:**

```bash
ssh appuser@<vps> "ls -la /var/www/alexanderlapygin/shared/failed/"
```

Если есть файлы:

```bash
ssh appuser@<vps> "cat /var/www/alexanderlapygin/shared/failed/*.json"
# Обработать каждое обращение вручную: ответить отправителю по email из payload.
# После обработки:
ssh appuser@<vps> "rm /var/www/alexanderlapygin/shared/failed/<filename>.json"
```

Если файлов нет — ничего не делать.

При систематическом появлении файлов (> 1 в месяц) — активировать §13.7 в [`spec.md`](./spec.md) (автоматическое уведомление).

### 9.2. Месячная проверка DMARC-отчётов

Проверять входящие DMARC-агрегатные отчёты (приходят на адрес из `rua=`). Парсер не настраивается — открыть последние отчёты, оценить долю прохождений SPF/DKIM. Целевой уровень — > 99%.

### 9.3. Полугодовое обновление зависимостей

Раз в полгода — пройти по открытым Renovate / Dependabot PR, ревью и merge. Внимание на:
- Astro мажорные обновления — переход на 7.x требует анализа breaking changes.
- nodemailer security-релизы — apply сразу.
- Node.js LTS — обновление до новой LTS-версии при выходе.

### 9.4. Годовая ротация секретов

См. раздел 10.

---

## 10. Ротация секретов

**Триггер:** ежегодно (по календарю автора) или немедленно при подозрении на компрометацию.

### 10.1. Пароль SMTP

1. Сгенерировать новый пароль приложения в личном кабинете SMTP-провайдера.
2. На VPS:
   ```bash
   ssh appuser@<vps> "nano /var/www/alexanderlapygin/shared/.env"
   # обновить SMTP_PASS
   ```
3. Перезапустить процесс:
   ```bash
   ssh deploy@<vps> "sudo systemctl restart alexanderlapygin.service"
   ```
4. Отправить тестовое обращение через форму, убедиться в доставке.
5. Отозвать старый пароль у провайдера.
6. Обновить копию `.env` в 1Password.

### 10.2. SSH-ключ деплоя

1. Сгенерировать новый ключ:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy-$(date +%Y)" -f deploy_key_new
   ```
2. Добавить публичный ключ в `~deploy/.ssh/authorized_keys` (НЕ удаляя старый).
3. Обновить `DEPLOY_SSH_KEY` в GitHub Secrets.
4. Сделать тестовый деплой push'ем в `main`.
5. После успеха — удалить старый публичный ключ из `~deploy/.ssh/authorized_keys`.

---

## 11. Процедура обработки запросов субъекта ПДн

**Срок исполнения:** не более 30 дней с момента запроса (требование 152-ФЗ).

### Шаги:

1. **Идентификация субъекта.** Найти email обращающегося в:
   - Почтовом ящике автора (поиск по email во входящих и исходящих).
   - `shared/failed/` (поиск через `grep <email>` в каталоге, под `appuser`).

2. **Виды запросов и действия:**
   - **Запрос об уточнении.** Сверить хранящиеся данные с тем, что субъект указывает как корректное. Изменить при необходимости — например, перенаправить переписку на новый email.
   - **Запрос на удаление.** Удалить все найденные записи: письма в основном ящике (включая корзину), файлы в `shared/failed/`. Записи в техническом логе не содержат текста и email — отдельных действий не требуется, удаляются по ротации в течение 30 дней.
   - **Запрос на переносимость.** Экспортировать переписку в текстовый файл или PDF и отправить субъекту.
   - **Отзыв согласия.** Удалить все данные (как при запросе на удаление) и отметить, что новые обращения этого субъекта будут отклоняться.

3. **Фиксация факта исполнения.** Запись в личном файле `pd-requests.md` (вне репозитория, в защищённом хранилище автора):
   ```
   - 2026-05-15: запрос от <email>, тип «удаление», исполнен 2026-05-15. UUID обращения: <uuid>.
   ```

4. **Ответ субъекту.** Письмо с подтверждением исполнения.

### Длительная недоступность автора

При планируемом отсутствии > 14 дней — настроить автоответчик на контактном email с упоминанием о возможной задержке ответа на запросы о ПДн и ориентировочной дате возвращения.

---

## 12. Реестр обработки ПДн (шаблон)

Внутренний документ, **не публикуется на сайте**, обязателен по ст. 22.1 152-ФЗ. Ведётся как внешний документ (например, в 1Password или Notion).

Структура:

```
# Реестр обработки персональных данных
Оператор: <ФИО автора>, <статус: ИП/самозанятый/физлицо>
Контакт: <email>

## Цели обработки
1. Обработка обращений потенциальных клиентов
2. Анализ посещаемости сайта (при согласии)

## Категории субъектов
- Посетители сайта alexanderlapygin.com и пользователи контактной формы

## Категории ПДн
- Контактная форма: имя, email, компания (опц.), детали проекта, IP-адрес, timestamp
- Метрика: cookie-идентификатор, IP-адрес, информация о браузере, поведенческие сигналы (только при согласии)

## Правовые основания
- Согласие субъекта данных (ст. 6 ч. 1 п. 1 152-ФЗ)

## Перечень действий с ПДн
- Сбор (через форму), хранение (в email и в shared/failed/), использование (для ответа), удаление (через автоматическую ротацию или по запросу)

## Сроки хранения
- Email-копии: до 12 месяцев или до завершения переговоров/проекта
- Технический лог: 30 дней
- shared/failed/: 90 дней

## Меры защиты
Технические:
- HTTPS на сайте
- Права 0600 на .env и shared/failed/
- Rate-limit и серверная валидация для API контактной формы
- HTML/CRLF-санитизация пользовательских значений
Организационные:
- Минимизация (текст обращения не пишется в лог)
- Регулярная проверка shared/failed/ автором (см. runbook §9.1)

## Передача третьим лицам
- Хостер: <название>, <страна>
- SMTP-провайдер: <название>, <страна>
- Метрика: Yandex (РФ), при согласии на cookies

## Дата последней актуализации
<дата>
```

Обновляется при изменении технического стека, провайдеров или политики (не реже раза в год).

---

## 13. Регистрационные действия с Роскомнадзором

### 13.1. Уведомление об обработке ПДн (ст. 22 152-ФЗ)

**Когда требуется:** в общем случае — да. Возможные исключения — ч. 2 ст. 22 (например, если обработка ведётся в рамках трудовых отношений, или ПДн только клиентов по договору, и т. п.). Для оператора-фрилансера с публичной контактной формой исключения обычно не применимы.

**Как подать:** через личный кабинет на pd.rkn.gov.ru с подтверждённой записью на Госуслугах. Срок рассмотрения — до 30 рабочих дней.

**До запуска сайта:** уведомление должно быть подано.

### 13.2. Уведомление о трансграничной передаче ПДн (ст. 12 152-ФЗ)

**Когда требуется:** при выборе **зарубежного хостинг-провайдера** ИЛИ **зарубежного SMTP-провайдера** ИЛИ иного зарубежного получателя данных. При полностью российской инфраструктуре (хостинг + SMTP) — НЕ требуется.

**Как подать:** через тот же личный кабинет pd.rkn.gov.ru. Срок рассмотрения — до 10 рабочих дней.

**До начала передачи:** уведомление должно быть подано. Это означает, что при выборе зарубежного хостинга — подача делается **до первой публикации сайта**, а не после.

---

## 14. Транслитерация slug

Схема: **практическая транслитерация** (упрощённая BGN/PCGN).

| Кир. | Лат. | Кир. | Лат. |
|---|---|---|---|
| а | a | р | r |
| б | b | с | s |
| в | v | т | t |
| г | g | у | u |
| д | d | ф | f |
| е | e | х | kh |
| ё | yo | ц | ts |
| ж | zh | ч | ch |
| з | z | ш | sh |
| и | i | щ | shch |
| й | y | ъ | (опускается) |
| к | k | ы | y |
| л | l | ь | (опускается) |
| м | m | э | e |
| н | n | ю | yu |
| о | o | я | ya |
| п | p | | |

Пробелы → `-`. Заглавные → строчные. Знаки препинания, кроме `-`, удаляются.

Реализация — функция `transliterate(s: string)` в `src/lib/slug.ts`, покрыта unit-тестами на каждую букву и краевые случаи.

Slug одного материала **совпадает между локалями**. Если RU-пост `delegirovanie-v-it` — EN-версия должна лежать как `delegirovanie-v-it.md`, не `delegation-in-it.md`. Это даёт устойчивые URL и одинаковые `xhtml:link` в sitemap.

---

## 15. Цели Метрики

Создаются вручную в интерфейсе счётчика. Имена должны точно соответствовать (любые расхождения — данные не собираются):

| Имя цели | Тип в Метрике | Триггер |
|---|---|---|
| `form_submit_success` | JavaScript-событие | Ответ 200 от `/api/contact` |
| `form_submit_error` | JavaScript-событие | Ответ 400/413/415/429/500, сетевая ошибка, таймаут |
| `mailto_click` | JavaScript-событие | Клик по любой `mailto:`-ссылке |
| `cta_click_home` | JavaScript-событие | Клик по основной CTA на главной |
| `cta_click_about` | JavaScript-событие | Клик по CTA на `/about` |
| `cta_click_solution` | JavaScript-событие | Клик по CTA в `/solutions` |
| `external_link_click` | JavaScript-событие | Клик по внешней ссылке на карточке проекта |
| `theme_toggle` | JavaScript-событие | Клик по переключателю темы |
| `lang_toggle` | JavaScript-событие | Клик по переключателю языка |
| `cookie_settings_open` | JavaScript-событие | Клик по «Настройки cookie» в подвале |

При пересоздании счётчика — воссоздать все цели по этому списку.

---

## 16. CSP-директивы

Полный текст HTTP-заголовка `Content-Security-Policy`:

```
default-src 'self';
script-src 'self' https://mc.yandex.ru https://mc.yandex.com https://mc.webvisor.org https://mc.webvisor.com https://yastatic.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://mc.yandex.ru https://mc.yandex.com https://mc.webvisor.org https://mc.webvisor.com;
connect-src 'self' https://mc.yandex.ru https://mc.yandex.com https://mc.webvisor.org https://mc.webvisor.com;
frame-src https://mc.yandex.ru https://mc.yandex.com;
font-src 'self';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests
```

Это однострочное значение (для nginx `add_header`) — переводы строк выше только для читаемости.

Альтернативно генерируется через `astro.config.mjs` (`security.csp.directives`).

**Проверка:** [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com). Ожидаемые предупреждения:
- `style-src 'unsafe-inline'` — High Risk. Принимается сознательно, см. [`decisions.md`](./decisions.md) §3.3.
- Остальные директивы — без предупреждений.

При добавлении нового внешнего домена (например, перехода на альтернативный SMTP с веб-формами) — пересмотр CSP и повторная проверка.

---

## 17. Lighthouse-аудит

**Когда запускать:** перед каждой существенной публичной версией.

**Где запускать:** локально через Chrome DevTools → Lighthouse, или CLI:

```bash
npm install -g lighthouse
lighthouse https://alexanderlapygin.com/ --view --form-factor=mobile
lighthouse https://alexanderlapygin.com/ --view --form-factor=desktop
```

**Что проверять:**

| Страница | Mobile Performance | Desktop Performance | Остальные |
|---|---|---|---|
| `/` (главная) | ≥ 80 | ≥ 95 | ≥ 95 |
| `/projects` | ≥ 80 | ≥ 95 | ≥ 95 |
| `/projects/{любой}` | ≥ 75 | ≥ 95 | ≥ 95 |
| `/blog` | ≥ 80 | ≥ 95 | ≥ 95 |
| `/blog/{любой}` | ≥ 75 | ≥ 95 | ≥ 95 |
| `/contact` | ≥ 80 | ≥ 95 | ≥ 95 |

При несоответствии — выявить причину (обычно — изображение без оптимизации, или CSS-блокировка, или сторонний скрипт без `defer`). Архивирование отчётов в git **не выполняется** (см. [`decisions.md`](./decisions.md) §4.4).

---

**Конец документа.**
