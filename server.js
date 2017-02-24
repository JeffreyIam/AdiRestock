var request = require('request')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var port = process.env.PORT
var accountSid = process.env.sid
var authToken = process.env.atoken
var client = require('twilio')(accountSid, authToken)
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(express.static('.'))
app.use(bodyParser.json())
app.listen(port, () => {
  console.log('listening on port: ' + port)
})

app.post('/check', (req, res) => {
  var gender = req.body.gender
  var productId = req.body.productId
  var number = req.body.number
  var size = req.body.size
  var menSizeTable = {
  4: '_530', 4.5: '_540', 5: '_550', 5.5: '_560', 6: '_570', 6.5: '_580', 7: '_590', 7.5: '_600', 8: '_610', 8.5: '_620', 9: '_630', 9.5: '_640', 10: '_650', 10.5: '_660', 11: '_670', 11.5: '_680', 12: '_690', 12.5: '_700', 13: '_710', 13.5: '_720', 14: '_730', 14.5: '_740', 15: '_750', 15.5: '_760', 16: '_770'
  }
  var womenSizeTable = {
    5: '_530', 5.5: '_540', 6: '_550', 6.5: '_560', 7: '_570', 7.5: '_580', 8: '_590', 8.5: '_600', 9: '_610', 9.5: '_620', 10: '_630', 10.5: '_640', 11: '_650', 11.5: '_660', 12: '_670'
  }

  const checkSize = (gender, productId, number, size) => {
    var sizeOptions = {
        method: 'GET',
        url: 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Product-GetVariants',
        qs: { pid: productId },
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
        'cache-control': 'no-cache' }
    }

    request(sizeOptions, function (error, response, body) {
      if (error) {
        console.log(error)
        setTimeout(() => { checkSize(gender, productId, number, size) }, 600000)
      }
      if (response === undefined || response.body.indexOf('variations') === -1) {
        console.log('PID not valid')
        res.json('N/A')
      } else {
        var sizes = JSON.parse(response.body).variations.variants
        for (var i = 0; i < sizes.length; i++) {
          var shoe = sizes[i]
          var shoeSize = shoe.attributes.size
          var inStock = shoe.avLevels.IN_STOCK
          var quantity = shoe.ATS
          var avStatus = shoe.avStatus
          // shoeSize === size ? console.log(chalk.yellow.bold(shoeSize) + ' : ' + chalk.yellow.bold(quantity) + ' ' + avStatus) : console.log(chalk.cyan.bold(shoeSize) + ' : ' + chalk.green.bold(quantity) + ' ' + avStatus)
          if(shoeSize === size && quantity > 1) {
            client.messages.create({
                to: `+${number}`,
                from: "+16697211202",
                body: `ID: ${productId}, Size: ${size} restocked! Quantity: ${quantity} http://www.adidas.com/us/search?q=${productId}`
            }, function(err, message) {
            })
          } else if(shoeSize === size && quantity <= 1) {
            console.log('No quantity right now. Checking in 5 mins')
            setTimeout(() => { checkSize(gender, productId, number, size) }, 300000)
          }
        }
      }
    })
  }
  checkSize(gender, productId, number, size)
})