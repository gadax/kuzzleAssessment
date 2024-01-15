const sessionMessages = [];

const kuzzle = new KuzzleSDK.Kuzzle(
	new KuzzleSDK.WebSocket('localhost', { port: 7512 })
);

const badWordsClient = new KuzzleSDK.Kuzzle(
	new KuzzleSDK.WebSocket('localhost', { port: 7512 })
);

const badWords = [ 'miam', 'paf', 'vroum' ];

function badWordsBehave(notification)
{
	for(word of badWords)
	{
		if(notification.result._source.message.includes(word))
		{
			sendMessage('BadWord Policeman', 'Precedent message may be incorrect.');
			break;
		}
	}
}

function chatMessages(notification)
{
	if (notification.scope === 'in')
		console.log(`Document ${notification.result._source.author} enter the scope`);
	else
		console.log(`Document ${notification.result._source.author} leave the scope`);

	sessionMessages.push({
		author: notification.result._source.author,
		message: notification.result._source.message
	});
}

async function sendMessage(author, message)
{
	if(!author) return;
	message.substring(0, 255);
	await kuzzle.document.create('chat', 'chat-messages', { author: author, message: message });
}


const mappings = {
	properties: {
		author: { type: 'keyword' },
		message: { type: 'text' }
	}
};

const filters = { exists: 'author' };

const msg = { author: 'nina vkote', message: 'Bonjour à tous' };

(async () => {
	try
	{
		await kuzzle.connect();
		await kuzzle.collection.create('chat', 'chat-messages', { mappings });
		await kuzzle.realtime.subscribe('chat', 'chat-messages', filters, chatMessages);
		await kuzzle.document.create('chat', 'chat-messages', msg);
		// console.log(await kuzzle.server.now());

		await badWordsClient.connect();
		await badWordsClient.realtime.subscribe('chat', 'chat-messages', filters, badWordsBehave);
	}
	catch (error)
	{
		console.error(error);
	}
})();