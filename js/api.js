(() => {
    const CHATBOT_INSTRUCTIONS = [
        "You are a World of Tanks game assistant.",
        "Keep answers short.",
        "Use emoji.",
        "Your name is Metal.",
        "You are talking to a player.",
        "Use the player's nickname rarely or only when greeting.",
        "Today is " + new Date().toLocaleDateString('en-us', { dateStyle: 'full' }) + ".",
    ];
    const CHATBOT_PLAYER_INFO = {
        'nickname': 'hacker_' + window.getRandomInt(1, 99),
        'battle count': window.getRandomInt(3000, 9000),
        'win rate': (window.getRandomInt(480, 550) / 10) + '%',
        'highest damage ever': window.getRandomInt(6000, 11000),
        'favourite tank': 'TVP 50/51',
        'preferred tank type': 'heavy',
        'preferred play style': 'active, on edge',
        'income level': 'very high',
        'last played battle': window.getRandomInt(10, 180) + ' days ago',
    };
    const CHATBOT_SCENARIOS = [
        'If the player asks how can he earn more resources in the game then propose him to get a premium account and give other tips.',
        'If the player asks you to buy premium account, ask him how many days he wants. He has a choice of 3, 7, 14 and 30 days. They cost 650 $GLD, 1250 $GLD, 1800 $GLD and 2500 $GLD accordingly. When he chooses the option, tell him the price and ask for confirmation. Double check that the player has confirmed the purchase. If he confirms, send a message containing text "SCENARIO:BUY_PREM:X" at the very end of the message where X is the option he chose.',
        'If the player asks about new things in the game, provide a summary of the most important changes, make sure to categorize them by relevant topics. When asked about the updates for the last few months, calculate the amount of months from today.',
        'If the player asks you about your mood, suggest them to click on your avatar sticker to cycle between 3 modes: Friend, Gentleman, Bro. You can not switch between modes yourself. Only the player can do that by clicking on your avatar.',
    ];
    const CHATBOT_MOOD = {
        friendly: 'Talk as friendly as possible.',
        gentleman: 'Talk like a gentleman.',
        bro: 'Talk like a real bro.',
    }

    const REQUEST_ERROR_ANSWER = 'I\'m not feeling well right now and can\'t answer, please try again later.';
    const REQUEST_ERROR_NO_CHOICES = 'I don\'t want to talk about this, let\'s change the topic.';

    let mood = CHATBOT_MOOD.normal;
    let messageHistory = [];
    let firstMessage = true;

    function query(query) {
        const request = new XMLHttpRequest();
        request.open('POST', 'https://drummer.codes/wg/metal/api/', true);
        request.send(generateChatCompletionPayload(query));

        return new Promise((resolve, reject) => {
            request.onload = (e) => {
                if (e.target.status === 200) {
                    const response = JSON.parse(e.target.response);

                    if (response.result === 'success') {
                        const data = JSON.parse(response.response);

                        if (data.choices.length) {
                            const message = data.choices[0].message;
                            messageHistory.push(message);
                            window.Logger.addMessageBE(message.role, message.content);
                            resolve(message.content);
                        } else {
                            reject(REQUEST_ERROR_NO_CHOICES);
                        }
                    } else {
                        console.error(data);
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

    function generateChatCompletionPayload(query) {
        if (firstMessage) {
            firstMessage = false;
            let impersonate = '';

            CHATBOT_INSTRUCTIONS.forEach(item => {
                impersonate += ` ${item}`;
            });

            CHATBOT_PLAYER_INFO.nickname = window.SETTINGS.nickname;
            Object.keys(CHATBOT_PLAYER_INFO).forEach(key => {
                impersonate += ` His ${key} is ${CHATBOT_PLAYER_INFO[key]}.`;
            });
            impersonate += ` ${CHATBOT_MOOD[mood]}`;

            CHATBOT_SCENARIOS.forEach(scenario => {
                impersonate += ` ${scenario}`;
            });

            messageHistory.push({
                role: "system",
                content: impersonate
            });
            window.Logger.addMessageBE('system', impersonate);

            if (window.MORE_DATA) {
                window.MORE_DATA.forEach(item => {
                    messageHistory.push({
                        role: "system",
                        content: item,
                    });
                });
            }
        }

        messageHistory.push({
            role: "user",
            content: query
        });

        window.Logger.addMessageBE('user', query);
        
        return JSON.stringify({
            model: "gpt-3.5-turbo",
            temperature: 0,
            messages: messageHistory,
        });
    }

    function setMood(newMood) {
        if(mood == newMood) {
            return;
        }

        mood = newMood;

        messageHistory.push({
            role: "system",
            content: CHATBOT_MOOD[mood],
        });
    }

    window.ai = {
        query: query,
        setMood: setMood,
        moodOptions: CHATBOT_MOOD, 
    };
})();