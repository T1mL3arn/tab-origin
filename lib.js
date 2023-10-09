export const actionTypeKey = 'extension-action-type'

export const actionType = {
	OPEN_TAB: 'open-tab',
	GO_TO_TAB_IF_OPEN: 'go-to-tab-if-open',
	SHOW_POPUP: 'show-popup'
}

export const actionTypeHint = {
	[actionType.OPEN_TAB]: 'Open and go to origin tab, if it is possible',
	[actionType.GO_TO_TAB_IF_OPEN]: 'Go to origin tab only if it\'s open. Otherwise show a popup with origin url.',
	[actionType.SHOW_POPUP]: 'Show a popup with origin url. From there you can decide if you want to open that url.',
}