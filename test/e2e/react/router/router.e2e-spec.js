// var utils = require('../../e2e/utils')

// describe('router.app', function () {
//   beforeEach(utils.verifyNoBrowserErrors)

//   it('should have correct number of transactions and traces', function (done) {
//     browser.url('/react/router/index.html')
//       .executeAsync(function (cb) {
//         window.runFixture('./simple-fetch-app.js', ['../angular/opbeat-angular.e2e.js', 'angular-route'], {
//           beforeInit: function (app, deps) {
//             deps[0]()
//             window.e2e.getTransactions(function (trs) {
//               cb(trs)
//             }, 0, 1)
//             app.init()
//           },
//           useNgApp: false,
//           uiRouter: false
//         })
//       })
//       .then(function (response) {
//         var transactions = response.value
//         // console.log('transactions', transactions)
//         expect(transactions.length).toBe(1)

//         var first = transactions[0]
//         expect(first.traces.groups.length).toBeGreaterThan(7)
//         expect(first.traces.raw[0].length).toBeGreaterThan(11)
//         expect(first.transactions.length).toBe(1)
//         expect(first.transactions[0].transaction).toBe('/')

//         done()
//       }, function (error) {
//         console.log(error)
//       })
//   })

//   afterEach(utils.verifyNoBrowserErrors)
// })
