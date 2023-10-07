const api = chrome
const actionTypeKey = 'extension-action-type'

const actionElt = document.querySelector('#extension-action-type')
actionElt.addEventListener('change', _ => {
    api.storage.local.set({ [actionTypeKey]: actionElt.value })
    api.storage.local.get(actionTypeKey).then(r => console.log('set()', r))
})