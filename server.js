let request = require('request')
let chalk = require('chalk')
let express = require('express')
let bodyParser = require('body-parser')
let app = express()
let port = 1337

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(express.static('.'))
app.use(bodyParser.json())
app.listen(port, () => {
  console.log('listening on port: ' + port)
})

app.post('/check', (req, res) => {
  let carrier = req.body.carrier
  let gender = req.body.gender
  let productId = req.body.productId
  let size = req.body.size
  let menSizeTable = {
  4: '_530', 4.5: '_540', 5: '_550', 5.5: '_560', 6: '_570', 6.5: '_580', 7: '_590', 7.5: '_600', 8: '_610', 8.5: '_620', 9: '_630', 9.5: '_640', 10: '_650', 10.5: '_660', 11: '_670', 11.5: '_680', 12: '_690', 12.5: '_700', 13: '_710', 13.5: '_720', 14: '_730', 14.5: '_740', 15: '_750', 15.5: '_760', 16: '_770'
  }
  let womenSizeTable = {
    5: '_530', 5.5: '_540', 6: '_550', 6.5: '_560', 7: '_570', 7.5: '_580', 8: '_590', 8.5: '_600', 9: '_610', 9.5: '_620', 10: '_630', 10.5: '_640', 11: '_650', 11.5: '_660', 12: '_670'
  }
  let sizeCode = gender === 'male' ? menSizeTable[size] : womenSizeTable[size]

  let sizeOptions = {
    method: 'GET',
    url: 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Product-GetVariants',
    qs: { pid: productId },
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
    'cache-control': 'no-cache' }
  }

  request(sizeOptions, function (error, response, body) {
    if (error) console.log(error)
    if (response === undefined || response.body.indexOf('variations') === -1) {
      console.log('Not available, checking again in 10 mins.')
    } else {
      let sizes = JSON.parse(response.body).variations.variants
      for (var i = 0; i < sizes.length; i++) {
        let shoe = sizes[i]
        let shoeSize = shoe.attributes.size
        let inStock = shoe.avLevels.IN_STOCK
        let quantity = shoe.ATS
        let avStatus = shoe.avStatus
        shoeSize === size ? console.log(chalk.yellow.bold(shoeSize) + ' : ' + chalk.yellow.bold(quantity) + ' ' + avStatus) : console.log(chalk.cyan.bold(shoeSize) + ' : ' + chalk.green.bold(quantity) + ' ' + avStatus)
        if(shoeSize === size && quantity > 1) {
          console.log(shoeSize, quantity)
        }
      }
    }
  })
})