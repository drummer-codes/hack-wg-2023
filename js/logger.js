(() => {
    const LOG_ALL = true;

    let oldLog = '';
    let sessionName = '';

    const MESSAGES = [];
    const MESSAGES_FE = [];
    const MESSAGES_BE = [];

    const TIME_FORMATTER = Intl.DateTimeFormat('ru', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h24',
    });

    Object.keys({ ...localStorage }).forEach(key => {
        if(key.startsWith('WgHack.Log.')) localStorage.removeItem(key);
    });

    window.Logger = {
        addMessageFull(container, type, author, content, log = false, error = false) {
            const time = TIME_FORMATTER.format(new Date()).replace(',', '');
            const message = `${time} [${author.toUpperCase()}]: ${content}`;

            if(!sessionName) {
                sessionName = new Date().getTime();
            }

            container.push(message);

            if(log || LOG_ALL) {
                (error ? console.error : console.log)(`${type} | ${message}`);
            }

            localStorage.setItem(`WgHack.Data.${sessionName}`, JSON.stringify({ MESSAGES, MESSAGES_FE, MESSAGES_BE }));
        },
        addMessageFE(author, content) {
            window.Logger.addMessageFull(MESSAGES_FE, 'FE', author, content);
        },
        addMessageBE(author, content) {
            window.Logger.addMessageFull(MESSAGES_FE, 'BE', author, content);
        },
        addMessage(author, content) {
            window.Logger.addMessageFull(MESSAGES, 'SYS', author, content, true);
        },
        addError(content) {
            window.Logger.addMessageFull(MESSAGES, 'ERR', 'ERROR', JSON.stringify(content), true, true);
        },
        export() {
            const data = {};
            const items = { ...localStorage };
            Object.keys(items).forEach(key => {
                const item = items[key];

                if(key.startsWith('WgHack.Data.')) {
                    key = key.split('.', 2);
                    data[key] = JSON.parse(item);
                }
            });
            const json = JSON.stringify(data);
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        },
    };
})()