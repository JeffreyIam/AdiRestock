var request = require('request')
var express = require('express')
var bodyParser = require('body-parser')
var chalk = require('chalk')
// var config = require('./config.json')
var app = express()
var port = process.env.PORT || 1337
var accountSid = process.env.sid
// || config.key.accountSID
var authToken = process.env.atoken
// || config.key.authToken
var client = require('twilio')(accountSid, authToken)
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(express.static('.'))
app.use(bodyParser.json())
app.listen(port, () => {
  console.log('listening on port: ' + port)
})

app.post('/getTable', (req, res) => {
  let productId = req.body.productId

  function checkSize(productId, cookie) {
    console.log(cookie)
    var sizeOptions = {
      method: 'GET',
      url: 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Product-GetVariants',
      qs: { pid: productId },
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.8',
        'Connection': 'keep-alive',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
        'Host': 'www.adidas.com',
        'Referer': 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Page-HeaderInfo',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }

    request(sizeOptions, function (error, response, body) {
      if (error) {
        console.log(error)
        setTimeout(() => { getCookies(productId) }, 300000)
      } else if (response === undefined || response.body.indexOf('variations') === -1) {
        res.end('PID not valid or product is not live.  Will text you if live.')
      } else {
        res.json(JSON.parse(response.body).variations.variants)
      }
    })
  }

  function getCookies(productId) {
    var options = {
      method: 'GET',
      url: 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Page-HeaderInfo',
      headers:
      { 'accept-language': 'en-US,en;q=0.8',
        'accept-encoding': 'gzip, deflate, sdch',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'upgrade-insecure-requests': '1',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
        host: 'www.adidas.com',
        'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
      formData:
      { categoryId: '10052',
        storeId: '7001',
        langId: '-1',
        catalogId: '20001',
        catEntryId: '553945',
        quantity: '1',
        orderId: '.',
        URL: '/',
        requesttype: 'ajax' } }

    request(options, function (error, response, body) {
      if (error) throw new Error(error)
      let setCookies = response.headers['set-cookie']
      let cookie = ''
      if(setCookies !== undefined) {
        for (var i = 0; i < setCookies.length; i++) {
          if (setCookies[i].indexOf('dwpersonalization') === -1 && setCookies[i].indexOf('username') === -1) {
            cookie += setCookies[i].match(/^(.*?);/)[0] + ' '
          }
        }
        cookie = cookie.slice(0, -2)
        checkSize(productId, cookie)
      } else {
        console.log(response)
        console.log('setCookies undefined')
        getCookies(productId)
      }
    })
  }
  getCookies(productId)
})

app.post('/check', (req, res) => {
  var gender = req.body.gender
  var productId = req.body.productId
  var number = req.body.number
  var size = req.body.size

  function checkSize(gender, productId, number, size, cookie) {
    console.log(cookie)
    var sizeOptions = {
      method: 'GET',
      url: 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Product-GetVariants',
      qs: { pid: productId },
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.8',
        'Connection': 'keep-alive',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
        'Host': 'www.adidas.com',
        'Referer': 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Page-HeaderInfo',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }

    request(sizeOptions, function (error, response, body) {
      if (error) {
        console.log(error)
        setTimeout(() => { getCookies(gender, productId, number, size) }, 300000)
      } else if (response === undefined || response.body.indexOf('variations') === -1) {
        res.end('PID not valid or product is not live.  Will text you if live.')
        setTimeout(() => { getCookies(gender, productId, number, size) }, 300000)
      } else {
        var sizes = JSON.parse(response.body).variations.variants
        var found = false
        for (var i = 0; i < sizes.length; i++) {
          var shoe = sizes[i]
          var shoeSize = shoe.attributes.size
          var quantity = shoe.ATS
          var avStatus = shoe.avStatus

          shoeSize === size ? console.log(chalk.yellow.bold(shoeSize) + ' : ' + chalk.yellow.bold(quantity) + ' ' + avStatus) : console.log(chalk.cyan.bold(shoeSize) + ' : ' + chalk.green.bold(quantity) + ' ' + avStatus)
          if (shoeSize === size && quantity > 1) {
            found = true
            client.messages.create({
              to: `+${number}`,
              from: '+16697211202',
              body: `ID: ${productId}, Size: ${size} restocked! Quantity: ${quantity} http://www.adidas.com/us/search?q=${productId}`
            })
            res.end('Found & sent text message alert!')
          } else if (shoeSize === size && quantity <= 1) {
            console.log('No quantity right now. Checking in 5 mins')
            res.end('Out of Stock, will text you if restocked.')
            setTimeout(() => { getCookies(gender, productId, number, size) }, 300000)
          }
        }
        if(!found) {
          res.end('This shoe is not offered in this size. Please query a different size.')
        }
      }
    })
  }

  function getCookies(gender, productId, number, size) {
    var options = {
      method: 'GET',
      url: 'http://www.adidas.com/on/demandware.store/Sites-adidas-US-Site/en_US/Page-HeaderInfo',
      headers:
      { 'accept-language': 'en-US,en;q=0.8',
        'accept-encoding': 'gzip, deflate, sdch',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'upgrade-insecure-requests': '1',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
        host: 'www.adidas.com',
        'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
      formData:
      { categoryId: '10052',
        storeId: '7001',
        langId: '-1',
        catalogId: '20001',
        catEntryId: '553945',
        quantity: '1',
        orderId: '.',
        URL: '/',
        requesttype: 'ajax' } }

    request(options, function (error, response, body) {
      console.log(body)
      if (error) throw new Error(error)
      let setCookies = response.headers['set-cookie']
      let cookie = ''
      if(setCookies !== undefined) {
        for (var i = 0; i < setCookies.length; i++) {
          if (setCookies[i].indexOf('dwpersonalization') === -1 && setCookies[i].indexOf('username') === -1) {
            cookie += setCookies[i].match(/^(.*?);/)[0] + ' '
          }
        }
        cookie = cookie.slice(0, -2)
        checkSize(gender, productId, number, size, cookie)
      } else {
        console.log(response)
        console.log('setCookies undefined')
        getCookies(gender, productId, number, size)
      }
    })
  }
  getCookies(gender, productId, number, size)
})


