'use strict';

console.log('[wotgenerals notifier] Init extension');

var watchedTabs = new Map();
var wotGeneralsUrl = ['*://wotgenerals.eu/*', '*://wotgenerals.ru/*', '*://wotgenerals.com/*'];
var noNotificationTabs = new Set();
var focusedWindow = true;
var firedNotifications = new Map();

function addToWatchTabs(tabs) {
  tabs.forEach(function (tab) {
    if (!watchedTabs.has(tab.id)) {
      console.log('[wotgenerals notifier] #' + tab.id + ' added to watched tabs');
      watchedTabs.set(tab.id, tab.title);
    }
  });

  console.log(watchedTabs);
}

function fireNotification(tab) {
  if (noNotificationTabs.has(tab.id)) {
    console.log('[wotgenerals notifier] Skip notification for #' + tab.id + ' (already notified)');
    return;
  }

  if (focusedWindow === chrome.windows.WINDOW_ID_NONE || focusedWindow !== tab.windowId || !tab.active) {
    console.log('[wotgenerals notifier] Fire notification for #' + tab.id);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/logo.svg',

      title: 'Go go go !',
      message: 'A vous de jouer'
    }, function (notificationId) {
      firedNotifications.set(notificationId, tab);
    });
    noNotificationTabs.add(tab.id);
  }
}

chrome.tabs.query({ url: wotGeneralsUrl }, addToWatchTabs);

chrome.tabs.onUpdated.addListener(function () {
  chrome.tabs.query({ url: wotGeneralsUrl }, addToWatchTabs);
});

chrome.tabs.onActivated.addListener(function (_ref) {
  var tabId = _ref.tabId;

  console.log('[wotgenerals notifier] Active tab #' + tabId);
  noNotificationTabs.delete(tabId);
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  console.log('[wotgenerals notifier] Removed tab #' + tabId);
  watchedTabs.delete(tabId);
  noNotificationTabs.delete(tabId);
});

chrome.notifications.onClicked.addListener(function (notificationId) {
  var tab = firedNotifications.get(notificationId);
  console.log('##########', notificationId, tab);
  chrome.tabs.update(tab.id, { 'active': true });
  chrome.windows.update(tab.windowId, { 'focused': true });
});

chrome.notifications.onClosed.addListener(function (notificationId) {
  firedNotifications.delete(notificationId);
});

setInterval(function () {

  chrome.windows.getCurrent(function (window) {
    var result = window.focused ? window.id : chrome.windows.WINDOW_ID_NONE;

    if (focusedWindow !== result) {
      console.log('[wotgenerals notifier] Focused window #' + result);
      focusedWindow = result;
    }

    watchedTabs.forEach(function (tabTitle, tabId) {
      chrome.tabs.get(tabId, function (tab) {
        if (tab.title !== tabTitle) {
          console.log('[wotgenerals notifier] #' + tab.id + ' changed title from "' + tabTitle + '" to "' + tab.title + '"');
          fireNotification(tab);
          watchedTabs.set(tabId, tab.title);
        }
      });
    });
  });
}, 500);
//# sourceMappingURL=background.js.map
