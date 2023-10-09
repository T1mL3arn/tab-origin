const actionTypeKey = 'extension-action-type'
const actionTypeHint = {
    'open-tab': 'Open and go to origin tab, if it is possible',
    'go-to-tab-if-open': 'Go to origin tab only if it\'s open. Otherwise show a popup with origin url.',
    'show-popup': 'Show a popup with origin url. From there you can decide if you want to open that url.',
}
const actionElt = document.querySelector('#extension-action-type')

setActionType('open-tab')

actionElt.addEventListener('change', _ => {
    console.log(actionElt.value);
    setActionHint(actionElt.value)
    chrome.storage.local.set({ [actionTypeKey]: actionElt.value })
    // chrome.storage.local.get(actionTypeKey).then(r => console.log('set()', r))
})

function setActionType(actionType) {
    actionElt.querySelector(`option[value=${actionType}]`).selected = true
    setActionHint(actionType)
}

function setActionHint(actionType) {
    const hintElt = document.querySelector('#extension-action-type ~ .form-group-hint')
    hintElt.textContent = actionTypeHint[actionType]
}

chrome.storage.local.get(actionTypeKey).then(data => {
    const actionType = data[actionTypeKey]
    setActionType(actionType)
})