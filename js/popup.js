chrome.tabs.getSelected(null, function(tab) {
  var currentURL = tab.url;
  var hostname = currentURL; // url.hostname;

  (function() {  
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
        options: {
          exclude: ''
        }
      },
      ready() {
        chrome.storage.local.get([storageKey], result => {
          var data = result[storageKey];
          if (data) {
            this.$set('power', data.power);
            this.$set('scripts', data.scripts);
            if (data.options) {
              this.$set('options', data.options);
            }
          }
          else {
            this.$set('power', true);
            this.$set('scripts', []);
            this.$set('options', DEFAULT_OPTIONS);
          }

          chrome.storage.sync.get([storageScriptKey + '_LEN'], len => {
            if (len != null && len[storageScriptKey + '_LEN'] != null) {
              for (let i = 0; i < len[storageScriptKey + '_LEN']; ++i) {
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
              }
            }
          });
        });
      },
      methods: {
        togglePower() {
          this.power = !this.power;
          this.save();
        },
        toggle(index) {
          var script = this.scripts[index];
          script.enable = !script.enable;
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
        save() {
          this._setStorage(this.$data);
        },
        isMatch(host) {
          if (this.isExcludeHost()) {
            return false;
          }
          if (host === '' || host === 'any') {
            return true;
          }
          var hosts, match;
          if (host.indexOf(',') !== -1) {
            hosts = host.split(',');
            match = hosts.some((_host) => {
              return hostname.indexOf(_host.trim()) !== -1;
            });
          }
          else {
            match = hostname.indexOf(host) !== -1;
          }
          return match;
        },
        isExcludeHost() {
          var host = this.options.exclude;
          if (host === '') {
            return false;
          }
          var hosts, match;
          if (host.indexOf(',') !== -1) {
            hosts = host.split(',');
            match = hosts.some((_host) => {
              return hostname.indexOf(_host.trim()) !== -1;
            });
          }
          else {
            match = hostname.indexOf(host) !== -1;
          }
          return match;
        },
        count() {
          var matched = this.scripts.filter((script) => {
            return this.isMatch(script.host);
          });
          return matched.length === 0 ? true : false;
        },
        openOption() {
          var fileName = 'options.html';
          var url = chrome.extension.getURL( fileName );
          chrome.tabs.create({
            url: url
          });
        }
      }
    });
  })();
});
