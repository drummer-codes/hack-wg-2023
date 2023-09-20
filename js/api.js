(() => {
    const OPENAI_API_KEY = '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';
    const OPENAI_API_BASE_URL = 'https://api.openai.com/v1/';
    const OPENAI_API_CHAT_URL = OPENAI_API_BASE_URL + 'chat/completions';

    const CHATBOT_IMPERSONATE = "You are a World of Tanks game assistant.";
    const CHATBOT_MOOD = {
        friendly: 'Talk as friendly as possible.',
        gentleman: 'Talk like a gentleman.',
        bro: 'Talk like a real bro.',
    }
    const CHATBOT_MESSAGE_SUFFIX_SHORT_ANSWER = "Keep the answer short.";

    const REQUEST_ERROR_ANSWER = 'I\'m not feeling well right now and can\'t answer, please try again later.';
    const REQUEST_ERROR_NO_CHOICES = 'I don\'t want to talk about this, let\'s change the topic.';

    let mood = CHATBOT_MOOD.normal;

    function query(query, longAnswer=false) {
        const request = new XMLHttpRequest();
        request.open('POST', OPENAI_API_CHAT_URL, true);

        request.setRequestHeader('Authorization', `Bearer ${OPENAI_API_KEY}`);
        request.setRequestHeader('Content-Type', 'application/json');

        request.send(generateChatCompletionPayload(query, longAnswer));

        return new Promise((resolve, reject) => {
            request.onload = (e) => {
                if (e.target.status === 200) {
                    const response = JSON.parse(e.target.response);
                    if (response.choices.length) {
                        const answer = response.choices[0].message.content;
                        resolve(answer);
                    } else {
                        reject(REQUEST_ERROR_NO_CHOICES);
                    }
                } else {
                    console.error(e.target);
                    reject(REQUEST_ERROR_ANSWER);
                }
            };
            request.onerror = (e) => {
                console.error(e.target);
                reject(REQUEST_ERROR_ANSWER);
            }
        });
    }

    function rephrase(originalQuery) {
        const rephrasedQuery = `Rephrase the following sentense keeping the original meaning: "${originalQuery}"`
        return query(rephrasedQuery);
    }

    function generateChatCompletionPayload(query, longAnswer=false) {
        // TODO: keep a history of previous messages for the context
        let messageSuffix = CHATBOT_MOOD[mood];
        if (!longAnswer) {
            messageSuffix += ` ${CHATBOT_MESSAGE_SUFFIX_SHORT_ANSWER}`;
        }

        return JSON.stringify({
            model: "gpt-3.5-turbo",
            temperature: 0.2,
            messages: [
                {
                    role: "system",
                    content: CHATBOT_IMPERSONATE
                },
                {
                    role: "user",
                    content: `${query} ${messageSuffix}`
                }
            ]
        });
    }

    function setMood(newMood) {
        mood = newMood;
    }

    window.ai = {
        query: query,
        rephrase: rephrase,
        setMood: setMood,
        moodOptions: CHATBOT_MOOD, 
    };
})();