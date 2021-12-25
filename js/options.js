(function() {
  var DEFAULT_SCRIPT = {
    id: null,
    enable: false,
    name: 'Script',
    type: 'snippet',
    src: '',
    code: '',
    host: ''
  };

  var DEFAULT_OPTIONS = {
    exclude: ''
  };
  
  const storageKey = 'SAR';
  const storageScriptKey = 'SAR_SCRIPT';

  var vm = new Vue({
    el: '#app',
    data: {
      power: true,
      scripts: [],
      options: {}
    },
    methods: {
      toggleSwitch() {
        this.power = !this.power;
        this.save();
      },
      addScript(type) {
        var script = _.extend({}, DEFAULT_SCRIPT);
        var id = this._getAvailableId();
        script.id = id;
        script.type = type;
        script.name += id;
        this.scripts.push(script);
      },
      _getAvailableId() {
        if (this.scripts.length === 0) {
          return 0;
        }
        var numbers = _.map(this.scripts, 'id');
        var num = _.max(numbers);
        
        return num + 1;
      },
      removeScript(index) {
        if (window.confirm('Are you sure you want to delete?')) {
          this.scripts.$remove(this.scripts.at(index));
        }
      },
      moveUp(index) {
        var script, temp;
        if (index - 1 >= 0) {
          script = this.scripts[index];
          temp = this.scripts[index - 1];
          this.scripts.$set(index - 1, script);
          this.scripts.$set(index, temp);
        }
      },
      moveDown(index) {
        var script, temp;
        if (index + 1 < this.scripts.length) {
          script = this.scripts[index];
          temp = this.scripts[index + 1];
          this.scripts.$set(index + 1, script);
          this.scripts.$set(index, temp);
        }
      },
      togglePower(index) {
        var script = this.scripts[index];
        script.enable = !script.enable;
        this.save();
      },
      _save() {
        return _.debounce(function() {
          this._setStorage(this.$data);
        }.bind(this), 500);
      },
      onKeyup() {
        this.save();
      },
      onBlur() {
        this.save();
      },
      _setStorage(data) {
        chrome.storage.local.set({[storageKey]: data});

        if (data == null || data.scripts == null || data.scripts.length == null) {
        } else {
          chrome.storage.sync.set({[storageScriptKey + '_LEN']: data.scripts.length});

          data.scripts.forEach((script, index) => {
            try {
              setTimeout(() => {
                const stringifid = zipson.stringify(script);
                const third1 = 1 * Math.floor(stringifid.length / 3);
                const third2 = 2 * Math.floor(stringifid.length / 3);

                chrome.storage.sync.set({
                  [storageScriptKey + '_' + index + '_0']: LZString.compressToUTF16(stringifid.substring(0, third1)),
                  [storageScriptKey + '_' + index + '_1']: LZString.compressToUTF16(stringifid.substring(third1, third2)),
                  [storageScriptKey + '_' + index + '_2']: LZString.compressToUTF16(stringifid.substring(third2))
                });
              }, 510 * (index + 1));
            } catch (e) {
              console.error(e);
            }
          });
        }
      },
      _loadScripts() {
        chrome.storage.local.get([storageKey], result => {
          var data = result[storageKey];

          if (data == null) {
            this.$set('power', false);
            this.$set('options', DEFAULT_OPTIONS);
            this.$set('scripts', []);
          } else {
            this.$set('power', data.power);

            if (!data.options) {
              this.$set('options', DEFAULT_OPTIONS);
            }
            else {
              this.$set('options', data.options);
            }

            if (data.scripts == null || data.scripts.length <= 0) {
              this.$set('scripts', []);
            } else {
              this.$set('scripts', data.scripts);
            }
          }

          chrome.storage.sync.get([storageScriptKey + '_LEN'], len => {
            if (len != null && len[storageScriptKey + '_LEN'] != null) {
              for (let i = 0; i < len[storageScriptKey + '_LEN']; ++i) {
                try {
                  chrome.storage.sync.get([storageScriptKey + '_' + i + '_0', storageScriptKey + '_' + i + '_1', storageScriptKey + '_' + i + '_2'], script => {
                    const script1 = script[storageScriptKey + '_' + i + '_0'];
                    const script2 = script[storageScriptKey + '_' + i + '_1'];
                    const script3 = script[storageScriptKey + '_' + i + '_2'];
                    let stringifid = '';

                    if (script1 != null && script1.length != null && script1.length > 0) {
                      stringifid += LZString.decompressFromUTF16(script1);
                    }
                    if (script2 != null && script2.length != null && script2.length > 0) {
                      stringifid += LZString.decompressFromUTF16(script2);
                    }
                    if (script3 != null && script3.length != null && script3.length > 0) {
                      stringifid += LZString.decompressFromUTF16(script3);
                    }

                    if (stringifid != null && stringifid.length != null && stringifid.length > 0) {
                      const obj = zipson.parse(stringifid);

                      this.scripts.$set(i, obj);
                    }
                  });
                } catch (e) {
                  console.error(e);
                }
              }
            }
          });
        });
      },
      _init() {
        chrome.storage.local.get(['SRA', storageKey], result => {
          var data = result.SRA;
          var newData = result[storageKey];
          
          if (!newData) {
            if (data) {
              this._setStorage(data);
              chrome.storage.local.remove(['SRA']);
            }
            else {
              this._setStorage({power: true, scripts: [], options: DEFAULT_OPTIONS});
            }
          }
          else {
            if (data) {
              chrome.storage.local.remove(['SRA']);
            }
          }
        });
      },
      toggleSetting() {
        if (_.includes(this.$els.setting.classList, 'show')) {
          this.$els.setting.classList.remove('show');
        }
        else {
          this.$els.setting.classList.add('show');
        }
      }
    },
    created() {
      this._init();
      this._loadScripts();
      this.save = this._save();
    },
    ready() {
      this.$watch('scripts', function(val, oldVal) {
        this._setStorage(this.$data);
      });
    }
  });
})();
