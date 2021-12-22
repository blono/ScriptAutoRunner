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
        }.bind(this), 300);
      },
      onKeyup() {
        this.save();
      },
      onBlur() {
        this.save();
      },
      _setStorage(data) {
        chrome.storage.local.set({[storageKey]: data});
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
