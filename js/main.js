const SETTINGS = {
    soundMuted: false,
    sfxInitialized: false,
    firstMessageSent: false,

    currentMood: localStorage.getItem('WgHack.CurrentMood') || Object.keys(window.ai.moodOptions)[0],
};
const ELEMENTS = {
    chatbar: document.getElementById('chatbar'),
    messageInput: document.getElementById('message-input'),
    messageClear: document.getElementById('message-clear'),
    sendMessageButton: document.getElementById('send-message'),
    messagesContainer: document.getElementById('messages'),
    typingIndicator: document.getElementById('typing-indicator'),
    introMessage: document.getElementById('intro'),
    avatar: document.getElementById('avatar'),
    avatarOuter: document.getElementById('avatar-outer'),
};

ELEMENTS.avatar.setAttribute('data-type', SETTINGS.currentMood);
ELEMENTS.avatarOuter.setAttribute('data-type', SETTINGS.currentMood);

//#region SFX
const SFX = {
    bg: new Audio("./audio/bg.mp3"),
    hover: new Audio("./audio/hover.mp3"),
    item: new Audio("./audio/item.mp3"),
    nav: new Audio("./audio/nav.mp3"),
    back: new Audio("./audio/back.mp3"),
    switch: new Audio("./audio/switch.mp3"),
    error: new Audio("./audio/error.mp3"),
    click: new Audio("./audio/click.mp3"),
    select: new Audio("./audio/select.mp3"),
};

for (const key in SFX) {
    const x = SFX[key];
    x.playNow = () => {
        if (SETTINGS.soundMuted) return;
        if (!SETTINGS.sfxInitialized) return;
        x.pause();
        x.currentTime = 0;
        x.play();
    };
    x.volume = 0.3;
}
SFX.bg.loop = true;
SFX.bg.volume = 0.05;
SFX.click.volume = 0.6;
SFX.select.volume = 0.6;

SFX.bg.play();

document.addEventListener('click', () => {
    SETTINGS.sfxInitialized = true;
    if (SFX.bg.paused || !SFX.bg.currentTime) {
        SFX.bg.play();
    }
});
[...document.getElementsByClassName('hand')].forEach(element => {
    element.addEventListener('mouseenter', () => {
        SFX.hover.playNow();
    });
});
//#endregion SFX

//#region Message Input

ELEMENTS.messageInput.addEventListener("input", function (e) {
    ELEMENTS.messageInput.classList.toggle("has-text", ELEMENTS.messageInput.value.length > 0);
    ELEMENTS.messageClear.classList.toggle("show", ELEMENTS.messageInput.value.length > 0);
});
ELEMENTS.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        ELEMENTS.sendMessageButton.click();
    }
});
ELEMENTS.messageClear.addEventListener("click", () => {
    ELEMENTS.messageInput.value = "";
    ELEMENTS.messageInput.dispatchEvent(new Event("input"));
    ELEMENTS.messageInput.focus();
    SFX.click.playNow();
});
ELEMENTS.sendMessageButton.addEventListener('click', () => {
    if (window.ChatBar.loading) {
      return;
    }
    if(ELEMENTS.messageInput.value) {
        if(!SETTINGS.firstMessageSent) {
            SETTINGS.firstMessageSent = true;
            ELEMENTS.introMessage.remove();
            ELEMENTS.avatarOuter.classList.remove('hide');
        }
        
        window.ai.setMood(SETTINGS.currentMood);
        window.ChatBar.sendMessage(ELEMENTS.messageInput.value);
        
        ELEMENTS.messageInput.value = "";
        ELEMENTS.messageInput.dispatchEvent(new Event("input"));
    }
});

//#endregion

//#region Functions

function openClose(sound) {
    if (sound) {
        if (ELEMENTS.chatbar.classList.contains('hide')) {
            SFX.nav.playNow();
        } else {
            SFX.back.playNow();
        }
    }
    ELEMENTS.chatbar.classList.toggle('hide');
}
function changeMood(sound) {
    if (sound) {
        SFX.switch.playNow();
    }
    const moodOptions = Object.keys(window.ai.moodOptions);
    const index = moodOptions.indexOf(SETTINGS.currentMood);
    if(index === moodOptions.length - 1) {
        SETTINGS.currentMood = moodOptions[0];
    } else {
        SETTINGS.currentMood = moodOptions[index + 1];
    }
    const avatar = SETTINGS.firstMessageSent ? ELEMENTS.avatarOuter : ELEMENTS.avatar;
    avatar.classList.add('hide');
    setTimeout(() => {
        ELEMENTS.avatar.setAttribute('data-type', SETTINGS.currentMood);
        ELEMENTS.avatarOuter.setAttribute('data-type', SETTINGS.currentMood);
        avatar.classList.remove('hide');
    }, 150);
    window.ChatBar.sendMessage(`You changed Metal's mood to "${SETTINGS.currentMood.charAt(0).toUpperCase() + SETTINGS.currentMood.slice(1)}".<br>He will now ${window.ai.moodOptions[SETTINGS.currentMood].toLowerCase()}`, 'system')
}

//#endregion