
var redux = require('redux')
var patchMethod = require('../common/patchUtils').patchMethod

function createCreateStore(serviceContainer) {
  return function createStoreWrapper (reducer, initialState, enhancer) {
    var transactionService = serviceContainer.services.transactionService

    if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
      enhancer = initialState
      initialState = undefined
    }

    var wrappedEnhancer
    if (typeof enhancer !== 'undefined') {
      wrappedEnhancer = function (createStore) {
        return enhancer(createStoreWrapper)
      }
    } else {
      wrappedEnhancer = enhancer
    }

    var store = redux.createStore(reducer, initialState, wrappedEnhancer)

    function patchStore (store) {
      patchMethod(store, 'dispatch', function (delegate) {
        return function (self, args) {
          var tr
          var transaction
          if (args.length === 1) {
            var action = args[0]
            var currTrans = transactionService.getCurrentTransaction()
            if (currTrans && currTrans.name !== 'ZoneTransaction') {
              if (action.type) {
                tr = transactionService.startTrace('dispatch ' + action.type, 'app.action')
              } else {
                tr = transactionService.startTrace('dispatch', 'app.action')
              }
            } else {
              if (action.type) {
                transaction = transactionService.startTransaction(action.type, 'spa.action')
              }
            }
          }

          var ret = delegate.apply(self, args)
          if (tr) {
            tr.end()
          }

          if (transaction) {
            transaction.detectFinish()
          }
          return ret
        }
      })

      return store
    }
    return patchStore(store)
  }
}
module.exports = {createCreateStore: createCreateStore}