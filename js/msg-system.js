(() => {
  const MSG_AUTHOR_SELF = 'self';
  const MSG_AUTHOR_BOT = 'bot';
  const MSG_AUTHOR_SYSTEM = 'system';

  const LIST_ITEM_TOKENS = [
    '- ',
    '1.',
    '2.',
    '3.',
    '4.',
    '5.',
    '6.',
    '7.',
    '8.',
    '9.',
  ];
  
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
      this.activeScenario = null;
      this.activeScenarioStep = 0;
      
      this._init();
    }
    
    _init() {
      this.msgs.forEach((el) => {
        this._renderMsg(el);
      })
    }
    _addMsg(msg, author) {
      if (!msg || !author) {
        console.error('!msg || !author');
        return;
      }
      
      const msgObj = {
        id: this._generateUID(),
        text: msg,
        originalText: msg,
        author: author,
        scenarioId: null,
        scenarioFired: false,
      }
      
      // scenarios
      // if (author === MSG_AUTHOR_SELF) {
      //   this._msgScenariosHandle(msgObj);
      // }
      this.checkForScenarios(msgObj);
      
      // formatting
      msgObj.text = this._formatMsg(msgObj.text);
      
      if (author === MSG_AUTHOR_SELF && !msgObj.scenarioId) {
        msgObj.isRequestNeeded = true;
      }
      
      this.msgs.push(msgObj);
      this._renderMsg(msgObj);
      
      return msgObj;
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

      window.Logger.addMessageFE(msgObj.author, msgObj.text);
      
      this.els.body.appendChild(msgElement);

      window.onMessageAdded();
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
      msgEl.dataset.uid = msgObj.id;
  
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
    _sendRequest(msg) {
      this.setLoading(true);
      window.ai.query(msg).then(answer => {
        this.setLoading(false)
        this.sendMessage(answer, MSG_AUTHOR_BOT);
      }).catch(error => {
        this.setLoading(false)
        window.Logger.addError(error);
      });
    }
    _sendProcessedAnswer() {
      
    }
    _formatMsg(msg) {
      //wrap lines in paragraphs
      let lines = msg.split("\n");
      msg = '';
      lines.forEach(line => {
        
        if (LIST_ITEM_TOKENS.includes(line.substr(0, 2))) {
          line = `\t ${line}`;
        }
        msg += `<p>${line}</p>`;
      });

      msg = msg.replace(/World of Tanks/g, '<b>World of Tanks</b>');
      msg = msg.replace(new RegExp(`/${window.SETTINGS.nickname}/g`), `<b>${window.SETTINGS.nickname}</b>`);

      //gold
      msg = msg.replace(/(\d+?)\s*\$GLD/g, (sub) => {
        const number = Number(sub.replace('$GLD', ''));
        return `<span class="price">${number}</span>`;
      });

      //SCENARIO END TOKEN

      msg = msg.replace(/SCENARIO:BUY_PREM:(\d){1,2}/g, (sub) => {
        const number = sub.split(':')[2];
        switch (number) {
          case '3':
            window.fakePurchase(650, 'You just bought 3 days of WoT Premium Account', () => {
              window.addPremiumDays(3);
            });
            break;
          case '7':
              window.fakePurchase(1250, 'You just bought 7 days of WoT Premium Account', () => {
                window.addPremiumDays(7);
              });
              break;
          case '14':
              window.fakePurchase(1800, 'You just bought 14 days of WoT Premium Account', () => {
                window.addPremiumDays(14);
              });
              break;
          case '30':
              window.fakePurchase(2500, 'You just bought 30 days of WoT Premium Account', () => {
                window.addPremiumDays(30);
              });
              break;
        
          default:
            break;
        }
        return '';
      });

      //remove blank paragraph
      msg = msg.replace(/<p><\/p>/g, '');
      
      // find urls
      msg = msg.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, function(url) { return '<a href="' + url + '">' + url + '</a>'; });
      return msg;
    }
    _generateUID() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    checkForScenarios(msgObj) {
      if (msgObj.author !== MSG_AUTHOR_SELF) {
        return;
      }
      if (this.activeScenario) {
        const scenario = this._scenarios2[this.activeScenario];
        const step = scenario[this.activeScenarioStep];
        if (step && step.query && step.query(msgObj)) {
          msgObj.scenarioFired = true;
        }
      } else {
        Object.keys(this._scenarios2).forEach((scenarioId) => {
          const isScenarioShouldStart = this._scenarios2[scenarioId][this.activeScenarioStep].query(msgObj);
          if (isScenarioShouldStart && this.activeScenario === null) {
            this.activeScenario = scenarioId;
            msgObj.scenarioFired = true;
          }
        })
      }
    }
    _scenarios2 = {
      // apple: [
      //   {
      //     query: (msgObj) => {
      //       return msgObj.text === 'apple';
      //     },
      //     answer: (msgObj) => {
      //       return 'apple scenario step 1'
      //     },
      //   },
      //   {
      //     query: (msgObj) => {
      //       return msgObj.text === 'apple2';
      //     },
      //     answer: (msgObj) => {
      //       return 'apple scenario step 2'
      //     },
      //   }
      // ],
      // tank2: [
      //   {
      //     query: (msgObj) => {
      //       return msgObj.text.includes('tank2')
      //     },
      //     answer: (msgObj) => {
      //       return 'tank2 scenario step 1'
      //     },
      //   }
      // ],
    }
    _randomInteger(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    sendMessage(msg, author = MSG_AUTHOR_SELF) {
      if (this.loading) {
        console.error('loading')
        return;
      }
      
      const msgObj = this._addMsg(msg, author);
      
      if (this.activeScenario && author === MSG_AUTHOR_SELF) {
        if (!msgObj.scenarioFired) {
          this.activeScenario = null;
          this.activeScenarioStep = 0;
          
          if (msgObj.isRequestNeeded) {
            this._sendRequest(msg);
          }
          return;
        }
        this.setLoading(true);
        
        setTimeout(() => {
          const scenarioAnswerObj = this._scenarios2[this.activeScenario][this.activeScenarioStep];
          const scenarioAnswerText = scenarioAnswerObj.answer(msgObj);
          
          this.setLoading(false);
          if (scenarioAnswerText) {
            this.sendMessage(scenarioAnswerText, MSG_AUTHOR_BOT);
          }
          this.activeScenarioStep++;
        }, this._randomInteger(750, 2000));
      } else if (msgObj.isRequestNeeded) {
        this._sendRequest(msg);
      }
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

