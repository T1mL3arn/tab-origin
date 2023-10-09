import { actionType, getActionType, actionTypeKey, TAB_ORIGIN_DATA_MSG } from '/lib.js';
import * as lib from '/lib.js';

// TODO: port to browser api
const api = chrome;

const activeTabKey = "activeTab";

let lastTabOriginData = {}

let currentActionType;

// Return the last element in an array.
// If the array is empty, return null.
function last(array) {
	if (!array || array.length === 0)
		return null;
	return array[array.length - 1];
}

function updateActionType(type) {
	currentActionType = type
}

/* 
		opening popup requires user gesture,
		but using await in action.onClicked()
		removes "user gesture" from the browser's point of view,
		so I have to subscribe to storage changes and
		prepare popup beforehand
*/
api.storage.local.onChanged.addListener(changes => {
	const actionType = changes[actionTypeKey]
	// looking only for "action type" changes
	if (actionType) {
		updateActionType(actionType.newValue)
	}
})

// Open the origin url of the given tab.
async function openTabOrigin(tab) {
	console.log('on action click');
	console.log('chosen action:', currentActionType)

	lastTabOriginData = {}

	const tabId = tab.id.toString();

	if (currentActionType === actionType.SHOW_POPUP 
		|| currentActionType === actionType.GO_TO_TAB_IF_OPEN) {
		api.action.setPopup({ popup: '/popup/popup.html' })
	}
	else {
		api.action.setPopup({ popup: '' })
	}

	// initiate "open tab" promises
	// if action is "show popup" - show it
	// send data to popup

	api.storage.local.get(tabId)
		.then(result => {
			const result_stack = result[tabId] || [];
			const url = last(result_stack)
			if (url) {
				api.tabs.query({ url }, function (matches) {
					
					let originTabId = matches[0]?.id
						, windowId = matches[0]?.windowId
						, currentTabIndex = tab.index;
					
					const originTabIsOpen = matches.length > 0;
					const tabOriginData = originTabIsOpen ? 
						{ tabId: originTabId, windowId, url } : { url, currentTabIndex, currentTabId: tab.id }

					if (currentActionType === actionType.SHOW_POPUP) {

						lastTabOriginData = tabOriginData
						
					} else if (currentActionType === actionType.GO_TO_TAB_IF_OPEN) {

						if (originTabIsOpen)
							lib.focusTab(originTabId, windowId)
						else {
							lastTabOriginData = tabOriginData
						}

					} else {
						// otherwise it is default "open tab" action

						if (originTabIsOpen)
							lib.focusTab(originTabId, windowId)
						else {
							lib.createTab(url, currentTabIndex, result_stack)
							// TODO set N/A label on errors
						}
					}
				});
			} else {
				console.log("Could not find origin for tab", tabId);
				api.action.setBadgeText({ text: "N/A", tabId: tab.id });
			}
		})

	if (currentActionType === actionType.SHOW_POPUP 
		|| currentActionType === actionType.GO_TO_TAB_IF_OPEN) {
		api.action.openPopup()

		// Popup is reset immediately because
		// I have to call browser.action.onClicked() every time.
		// onClicked() is not called with non-null popup.
		api.action.setPopup({ popup: '' })
	}
}

function updateOpenerState(newTab, openerTab) {
	const match_id = openerTab.id.toString();
	const tab_id = newTab.id.toString();
	// We set the new tab's history stack to
	// [original tab's history] + original tab's URL.
	// By retaining the entire history stack, we can do the nifty trick of
	// keeping tab origin state across repeated invocations, allowing us to tab
	// origin our way all the way back to the first tab opened.
	api.storage.local.get(match_id, function (result) {
		const match_stack = result[match_id] || [];
		// The query API does not match on hash mark, so strip that off.
		if (openerTab.url.lastIndexOf("#") > -1) {
			const base = openerTab.url.substr(0, openerTab.url.lastIndexOf("#"));
			api.storage.local.set({ [tab_id]: match_stack.concat([base]) });
		} else {
			api.storage.local.set({ [tab_id]: match_stack.concat([openerTab.url]) });
		}
	});

}

// Remark: on new tab creation, we receive onCreated before onActivated.
api.tabs.onActivated.addListener(info => {
	const id = info.tabId;
	api.storage.local.set({ [activeTabKey]: id });
});

api.tabs.onCreated.addListener(function (tab) {
	if (tab.openerTabId !== undefined) {
		api.tabs.get(tab.openerTabId, function (match) {
			if (match !== undefined) {
				updateOpenerState(tab, match);
			} else {
				console.log("Opener is defined, but I can't find it for " + tab.url);
			}
		});
	} else {
		//TODO: file a bug!
		// in firefox openerTabId is not set for tabs opened by alt-enter in address bar.
		// (it's only set for tabs opened from links on the page)
		api.storage.local.get(activeTabKey, tabId => {
			api.tabs.get(tabId[activeTabKey], match => {
				if (match !== undefined) {
					updateOpenerState(tab, match);
				} else {
					console.log("Attempted to use active tab as opener, but it was not set.");
				}
			});
		});
	}
})

api.tabs.onRemoved.addListener(function (tabId) {
	api.storage.local.set({ [tabId.toString()]: [] });
});

getActionType().then(updateActionType)
api.action.onClicked.addListener(openTabOrigin);
api.runtime.onMessage.addListener((msg, _, sendResponse) => {
	console.log('bg script recieved a message:', msg);
	if (msg[TAB_ORIGIN_DATA_MSG] !== undefined)
		sendResponse(lastTabOriginData)
})