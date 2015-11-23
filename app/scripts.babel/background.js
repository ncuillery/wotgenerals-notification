'use strict';

console.log('[wotgenerals notifier] Init extension');

const watchedTabs = new Map();
const wotGeneralsUrl = [
  '*://wotgenerals.eu/*',
  '*://wotgenerals.ru/*',
  '*://wotgenerals.com/*'
];
const notificationDefinition = {
  type: 'basic',
  iconUrl: 'images/logo.svg',
  title: 'Go go go !',
  message: 'A vous de jouer'
};

let noNotificationTabs = new Set();
let focusedWindow = true;
let firedNotifications = new Map();

function addToWatchTabs(tabs) {
  tabs.forEach(tab => {
    if(!watchedTabs.has(tab.id)) {
      console.log(`[wotgenerals notifier] #${tab.id} added to watched tabs`);
      watchedTabs.set(tab.id, tab.title);
    }
  });
}

function fireNotification(tab) {
  if(noNotificationTabs.has(tab.id)) {
    console.log(`[wotgenerals notifier] Skip notification for #${tab.id} (already notified)`);
    return;
  }

  if(focusedWindow === chrome.windows.WINDOW_ID_NONE || focusedWindow !== tab.windowId || !tab.active) {
    console.log(`[wotgenerals notifier] Fire notification for #${tab.id}`);
    chrome.notifications.create(notificationDefinition, notificationId => {
      firedNotifications.set(notificationId, tab);
    });
    noNotificationTabs.add(tab.id);
  }
}

chrome.tabs.query({url: wotGeneralsUrl}, addToWatchTabs);

chrome.tabs.onUpdated.addListener(() => {
  chrome.tabs.query({url: wotGeneralsUrl}, addToWatchTabs);
});

chrome.tabs.onActivated.addListener(({tabId}) => {
  console.log(`[wotgenerals notifier] Active tab #${tabId}`);
  noNotificationTabs.delete(tabId);
});

chrome.tabs.onRemoved.addListener(tabId => {
  console.log(`[wotgenerals notifier] Removed tab #${tabId}`);
  watchedTabs.delete(tabId);
  noNotificationTabs.delete(tabId);
});

chrome.notifications.onClicked.addListener(notificationId => {
  let tab = firedNotifications.get(notificationId);
  console.log(`[wotgenerals notifier] Removed tab #${tabId}`);
  chrome.tabs.update(tab.id, {'active': true});
  chrome.windows.update(tab.windowId, {'focused': true});
});

chrome.notifications.onClosed.addListener(notificationId => {
  firedNotifications.delete(notificationId);
});

setInterval(() => {

  chrome.windows.getCurrent(window => {
    let result = window.focused ? window.id : chrome.windows.WINDOW_ID_NONE;

    if(focusedWindow !== result) {
      console.log(`[wotgenerals notifier] Focused window #${result}`);
      focusedWindow = result;
    }

    watchedTabs.forEach((tabTitle, tabId) => {
      chrome.tabs.get(tabId, tab => {
        if(tab.title !== tabTitle) {
          console.log(`[wotgenerals notifier] #${tab.id} changed title from "${tabTitle}" to "${tab.title}"`);
          fireNotification(tab);
          watchedTabs.set(tabId, tab.title);
        }
      });
    });
  });


}, 500);