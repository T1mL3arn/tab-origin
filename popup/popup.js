import * as lib from '/lib.js'

document.body.classList.add('d-none')

if (!(window.chrome || window.browser)) {
	// it is not extension context, 
	// means it is context to test markup
	document.body.classList.remove('d-none')
}

const urlElt = document.querySelector('.origin-tab-info-url')
const goBtnElt = document.querySelector('.btn-main')

let tabOriginData;

function focusTab() {
	const { tabId, windowId } = tabOriginData
	console.log('focusTab() tabOriginData:', tabOriginData)
	lib.focusTab(tabId, windowId)
	window.close()
}

function createTab() {
	const tabId = tabOriginData.currentTabId.toString()
	chrome.storage.local.get(tabId)
		.then(data => {
			const historyStack = data[tabId]
			const { url, currentTabIndex, currentTabId} = tabOriginData
			return lib.createTab(url, currentTabIndex, currentTabId)
		})
		.catch(e => {
			// TODO show error msg
		})
}

lib.sendMessage(lib.TAB_ORIGIN_DATA_MSG, null)
	.then(response => {
		console.log('response from bg script: ', response);

		tabOriginData = response

		// url can be undefined since every time
		// user clicks extension button it resets
		const url = tabOriginData?.url

		if (url) {
			document.body.classList.remove('d-none')

			urlElt.value = url

			if (response.tabId !== undefined) {
				// 	- tab is already open(but not active), you can switch to it

				goBtnElt.onclick = focusTab
				goBtnElt.innerText = 'Go to Tab'
				
			} else if (response.currentTabId !== undefined) {
				//	- tab is not open at all, you can open it
				
				goBtnElt.onclick = createTab
				goBtnElt.innerText = 'Open Tab'
			}
		} else {
			window.close()
		}
	})

lib.getActionType().then(actionType => {
	console.log('action type read from popup.js:', actionType);
	switch (actionType) {
		case lib.actionType.OPEN_TAB:

			// normally this branch should never be executed
			console.log('closing popup from popup');
			window.close()
			break

		case lib.actionType.GO_TO_TAB_IF_OPEN:
		case lib.actionType.SHOW_POPUP:
			// do nothing
			console.log('show popup from popup.js');
			// chrome.runtime.onMessage.addListener(onMessage)
			break
	}
})
