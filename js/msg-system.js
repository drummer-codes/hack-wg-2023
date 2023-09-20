(() => {
  const MSG_AUTHOR_SELF = 'self';
  const MSG_AUTHOR_BOT = 'bot';
  const MSG_AUTHOR_SYSTEM = 'system';
  
  class ChatBar {
    constructor() {
      this.els = {
        body: document.getElementById('messages'),
        loading: document.getElementById('typing-indicator'),
        inputWrap: document.getElementById('input-wrap'),
        input: document.getElementById('message-input'),
      }
      this.msgs = [];
      this.loading = false;
      
      this._init();
    }
    
    _init() {
      this._initMsgRendering();
    }
    _addMsg(msg, author) {
      if (!msg || !author) {
        console.error('!msg || !author');
        return;
      }
      
      const msgObj = {
        id: this._generateUID(),
        text: this._handleMsg(msg),
        author: author
      }
      this.msgs.push(msgObj);
      this._renderMsg(msgObj);
    }
    _handleMsg(msg) {
      // some magic with text
      // console.log('_handleMsg', msg);
      //find urls
      msg = msg.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, function(url) { return '<a href="' + url + '">' + url + '</a>'; });
      return msg;
    }
    _generateUID() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    _renderMsg(msgObj) {
      if (!msgObj || typeof msgObj !== 'object') {
        console.error('_renderMsg, !msgObj || typeof msgObj !== object');
        return;
      }
      const msgElement = this._generateMsgElement(msgObj);
      if (!msgElement) {
        console.error('_renderMsg, no msgElement');
      }

      if (msgObj.author === MSG_AUTHOR_SYSTEM) {
        setTimeout(() => {
          msgElement.classList.add('hide');
          setTimeout(() => {
            msgElement.remove();
          }, 1100);
        }, 5000);
      }
      
      this.els.body.appendChild(msgElement);
    }
    _generateMsgElement(msgObj) {
      if (!msgObj || typeof msgObj !== 'object') {
        console.error('_generateMsgElement, !msgObj || typeof msgObj !== object');
        return;
      }
      
      let classModifier = null;
      if (msgObj.author === MSG_AUTHOR_SELF) {
        classModifier = 'chatbar_msg__self';
      } else if (msgObj.author === MSG_AUTHOR_BOT) {
        classModifier = 'chatbar_msg__bot';
      } else if (msgObj.author === MSG_AUTHOR_SYSTEM) {
        classModifier = 'chatbar_msg__system'
      }
      
      const msgEl = document.createElement('div');
      msgEl.classList.add('chatbar_msg');
      if(classModifier) msgEl.classList.add(classModifier);
  
      const msgContent = document.createElement('div');
      msgContent.innerHTML = msgObj.text;
      msgEl.appendChild(msgContent);
  
      const now = new Date();
      const msgTime = document.createElement('div');
      msgTime.classList.add('chatbar_msg-time');
      msgTime.textContent = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
      msgEl.appendChild(msgTime);
      
      return msgEl;
    }
    _initMsgRendering() {
      this.msgs.forEach((el) => {
        this._renderMsg(el);
      })
    }
    _sendRequest(msg) {
      this.setLoading(true);
      window.ai.query(msg).then(answer => {
        this.setLoading(false)
        this.sendMessage(answer, MSG_AUTHOR_BOT);
      }).catch(error => {
        this.setLoading(false)
        console.log(error);
      });
    }
    sendMessage(msg, author = MSG_AUTHOR_SELF) {
      if (this.loading) {
        return;
      }
      
      this._addMsg(msg, author);
      if (author === MSG_AUTHOR_SELF) {
        this._sendRequest(msg);
      }
    }
    removeMessage(id) {
      // TODO
      console.log('removeMessage', id);
    }
    setLoading(val) {
      if (val) {
        this.els.loading.classList.add('show');
        this.els.inputWrap.classList.add('chatbar_input-wrap__loading');
      } else {
        this.els.loading.classList.remove('show');
        this.els.inputWrap.classList.remove('chatbar_input-wrap__loading');
        this.els.input.focus();
      }
      this.loading = val;
    }
  }
  
  window.ChatBar = new ChatBar();
})();

