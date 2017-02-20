var initOpbeat = require('../../src/react').configure
// var _setServiceContainer = require('../../src/react')._setServiceContainer
var getServiceContainer = require('../../src/react').getServiceContainer
var captureError = require('../../src/react').captureError
var createOpbeatMiddleware = require('../../src/redux').createOpbeatMiddleware
var createStore = require('redux').createStore
var ServiceFactory = require('opbeat-js-core').ServiceFactory
var ServiceContainer = require('opbeat-js-core').ServiceContainer

var TransportMock = require('../utils/transportMock')

initOpbeat({'orgId': '', 'appId': ''})


describe('react-redux: opbeatMiddleware', function () {
  var transactionService
  var opbeat
  var store
  var testAction = {type: 'TEST_ACTION'}
  var middleware, count, api
  var serviceContainer = getServiceContainer()
  var serviceFactory
  var originalTransport

  var nextMiddleware = function (api) {
    return function (next) {
      return function (action) {
        count++
        expect(action).toBe(testAction)
        expect(next).toBe(null)
      }
    }
  }

  beforeEach(function () {
    originalTransport = serviceContainer.services.opbeatBackend._transport
    serviceContainer.services.opbeatBackend._transport = new TransportMock()
    
    
    transactionService = serviceContainer.services.transactionService
    
    var reducer = function (state, action) { return state }
    store = createStore(reducer, {'hello': 'world'})

    middleware = createOpbeatMiddleware()
    count = 0

    api = {
      dispatch: store.dispatch,
      getState: store.getState
    }
  })

  it('should start transaction if none exists', function () {
    spyOn(transactionService, 'startTransaction').and.callThrough()

    expect(transactionService.startTransaction.calls.count()).toBe(0)
    expect(transactionService.getCurrentTransaction()).toBeUndefined()

    middleware(api)(nextMiddleware(api)(null))(testAction)

    expect(transactionService.startTransaction).toHaveBeenCalledWith(testAction.type, 'action')

    expect(count).toBe(1)
  })

  it('should start trace if transaction is already running', function () {
    serviceContainer.services.zoneService.runInOpbeatZone(function() {
        var transaction = transactionService.startTransaction('my-transaction', 'action')

        spyOn(transactionService, 'startTransaction').and.callThrough()
        spyOn(transaction, 'startTrace').and.callThrough()

        middleware(api)(nextMiddleware(api)(null))(testAction)

        expect(transactionService.startTransaction).not.toHaveBeenCalled()
        expect(transaction.startTrace).not.toHaveBeenCalledWith(testAction.type, 'action')

        expect(count).toBe(1)
        transaction.end()
      }
    )
  })

  it('sends errors with store state', function (done) {
    // _installErrorLogger(serviceContainer)
    var transport = serviceContainer.services.opbeatBackend._transport = new TransportMock()
    debugger;
    expect(transport.errors).toEqual([])
    transport.subscribe(function (event, errorData) {
      if (event === 'sendError') {
        debugger;
        expect(errorData.data.message).toBe('Error: test error')
        expect(errorData.data.extra['Store state']).toEqual({ hello: 'world' })
        expect(errorData.data.extra['Last 10 actions']).toEqual([ 'TEST_ACTION' ])
        done()
      }
    })
    var err = new Error('test error')
    captureError(err)
  })

  afterEach(function() {
    serviceContainer.services.opbeatBackend._transport = originalTransport
  })
})
