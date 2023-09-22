window.addEventListener('keydown', e => {
    if (e.key == 'Tab') {
        e.preventDefault();

        const step = Number(document.body.getAttribute('data-step') || '0') + 1;
        document.body.setAttribute('data-step', step);

        console.log('DEMO: STEP ' + step);

        switch (step) {
            case 3:
                demo_type('hey there');
                break;
            case 4:
                demo_type('what is the tank\'s crew for?');
                break;
            case 5:
                demo_type('haven\'t played wot for some time, what\'s new in summary?');
                break;
            case 6:
                demo_type('how to get better at the game and earn more stuff?');
                break;
            case 7:
                demo_type('i really need some premium account');
                break;
            case 8:
                demo_type('yo bro i think i just sold my tank by accident, what do i do?');
                break;
            case 9:
                demo_type('thanks man!');
                break;

            default:
                break;
        }
    }
});

async function demo_type(text, send = true) {
    const textElement = document.getElementById('message-input');
    const sendElement = document.getElementById('send-message');

    const delayTime = 30;
    let currentText = '';

    textElement.focus();

    for (let i = 0; i < text.length; i++) {
        currentText = text.substring(0, i + 1);
        textElement.value = currentText;
        textElement.dispatchEvent(new KeyboardEvent("keydown", {
            key: text[i],
        }));
        textElement.dispatchEvent(new Event("input"));
        textElement.focus();
        await delay(delayTime);
    }

    textElement.value = text;
    textElement.focus();

    if (send) {
        await delay(delayTime);
        sendElement.click();
    }
}