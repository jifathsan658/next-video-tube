# মোবাইল থেকে চালানোর সহজ ধাপ

## ১) GitHub
- GitHub-এ নতুন repository খুলুন: `next-video-tube`
- ZIP extract করে সব file repository-তে upload করুন।
- কোনো token/password GitHub-এ লিখবেন না।

## ২) Cloudflare
- Cloudflare account খুলুন।
- Workers & Pages → Create application → Worker/Static Assets project নিন।
- এই project deploy করার জন্য Wrangler ব্যবহার করা সবচেয়ে সহজ।
- D1 database তৈরি করুন এবং `schema.sql` চালান।

## ৩) Telegram
- BotFather দিয়ে bot তৈরি করুন।
- Bot token secret হিসেবে Cloudflare-এ রাখুন।
- Mini App URL হিসেবে আপনার deployed HTTPS URL দিন।
- Worker webhook URL হবে:
  `https://YOUR-DOMAIN/telegram/webhook`

## ৪) Monetag
- Monetag publisher account খুলুন।
- Telegram Mini App add করুন।
- Rewarded Interstitial SDK tag তৈরি করুন।
- Monetag যে SDK URL + `show_XXXXXX` function দেয়, সেটা `public/config.js`-এ বসান।
- Postback URL হিসেবে আপনার deployed `/postback?...` endpoint দিন।

## ৫) Demo থেকে Real
`public/config.js`-এ:
`DEMO_MODE: false`

তারপর:
- SDK_URL বসান
- SDK_FUNCTION বসান
- deploy করুন

## ৬) Content
D1-এর `content` table-এ নিজের legal/non-explicit content যোগ করুন।
Preview URL এবং full URL public/authorized storage-এ রাখুন।

### গুরুত্বপূর্ণ
Reward unlock-কে production-এ শুধু frontend callback-এর ওপর নির্ভর করাবেন না। Monetag postback-এর `reward_event_type=valued` ব্যবহার করে server-side verification রাখুন।
