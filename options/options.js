import * as lib from '/lib.js'

const actionElt = document.querySelector('#extension-action-type')

setActionType(lib.actionType.OPEN_TAB)

actionElt.addEventListener('change', _ => {
    console.log(actionElt.value);
    setActionHint(actionElt.value)
    chrome.storage.local.set({ [lib.actionTypeKey]: actionElt.value })
    // chrome.storage.local.get(lib.actionTypeKey).then(r => console.log('set()', r))
})

function setActionType(actionType) {
    actionElt.querySelector(`option[value=${actionType}]`).selected = true
    setActionHint(actionType)
}

function setActionHint(actionType) {
    const hintElt = document.querySelector('#extension-action-type ~ .form-group-hint')
    hintElt.textContent = lib.actionTypeHint[actionType]
}

// init - load settings 
lib.getActionType().then(setActionType)