chrome.action.onClicked.addListener((tab) => {
  if (!tab.url?.includes("chatgpt.com") && !tab.url?.includes("chat.openai.com")) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_NAV_PANEL" });
});
