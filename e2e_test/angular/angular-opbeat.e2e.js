var logger = require('loglevel')
var ngOpbeat = require('./ngOpbeat')
var TransactionService = require('../transaction/transaction_service')
var OpbeatBackend = require('../backend/opbeat_backend')

var Subscription = require('../common/subscription')

function TransportMock () {
  this.transactions = []
  this.subscription = new Subscription()
}

TransportMock.prototype.sendTransaction = function (transactions) {
  this.transactions = this.transactions.concat(transactions)
  this.subscription.applyAll(this, [transactions])
}

TransportMock.prototype.subscribe = function (fn) {
  this.subscription.subscribe(fn)
}

function init () {
  logger.setLevel('debug', false)
  var transactionService = new TransactionService(logger, {})

  ngOpbeat(transactionService, logger)
  var transportMock = new TransportMock()
  var opbeatBackend = new OpbeatBackend(transportMock, logger)
  transactionService.subscribe(function (tr) {
    opbeatBackend.sendTransactions([tr])
  })

  function getTransactions (callback, start, end) {
    if (transportMock.transactions.length >= end) {
      var trs = transportMock.transactions.slice(start, end)
      callback(trs)
      return
    }

    var cancel = transportMock.subscribe(function () {
      logger.debug('Number of transactions: ', transportMock.transactions.length)
      if (transportMock.transactions.length >= end) {
        var trs = transportMock.transactions.slice(start, end)
        callback(trs)
        cancel()
      }
    })
  }

  window.e2e = {
    transactionService: transactionService,
    transportMock: transportMock,
    getTransactions: getTransactions
  }
  return transactionService
}

module.exports = init