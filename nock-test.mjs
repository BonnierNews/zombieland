import nock from 'nock';

nock.disableNetConnect();
// nock('https://stick.nu')
// 	.get('/va')
// 	.reply(307, undefined, { location: '/ja' })
// 	.get('/ja')
// 	.reply(200, 'va!');

// fetch('https://stick.nu/va', { redirect: 'follow' })
// 	.then(r => console.log(r.status, r.redirected, r.url));

nock('https://www.expressen.se')
	.get('/sport')
	.reply(308, undefined, { location: '/sport/' })
	.get('/sport/')
	.reply(200, 'va!');


console.log('with nock');
await fetch('https://www.expressen.se/sport', { redirect: 'follow' })
	.then(r => console.log(r.status, r.redirected, r.url) || r.text())
	.then(b => console.log(b.length));

nock.restore();

console.log('without nock');
await fetch('https://www.expressen.se/sport', { redirect: 'follow' })
	.then(r => console.log(r.status, r.redirected, r.url) || r.text())
	.then(b => console.log(b.length));
