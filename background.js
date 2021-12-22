chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const storageKey = 'SAR';

  if (message.method == 'GetStorage') {
    const getStorage = (key = null) => new Promise(resolve => {
      chrome.storage.local.get([key], resolve);
    });
    const getResponse = async () => {
      const defaultResponse = {
        data: {
          power: true,
          scripts: [],
          options: {
            exclude: ''
          },
          tabId: sender.tab.id
        }
      };

      try {
        let data = await getStorage(storageKey);
  
        if (data) {
          data = data[storageKey];
          data.tabId = sender.tab.id;

          return { data };
        }
      } catch (e) {
        console.error(e);

        return defaultResponse;
      }

      return defaultResponse;
    };
    const send = async() => {
      const response = await getResponse();
      sendResponse(response);
    };

    send();

    return true;
  } else if (message.method == 'RunScript') {
    chrome.scripting.executeScript({
      target: { tabId: message.tabId, allFrames: true },
      func: Function(message.code)
    });

    return true;
  }
});

chrome.browserAction.onClicked.addListener(tab => {
  chrome.browserAction.setPopup({
    'popup': 'popup.html'
  });
});
