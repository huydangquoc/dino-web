var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var AWS = require('aws-sdk');
AWS.config.update({
	"accessKeyId": "AKIAJNJMJT2NPUKJQ4YA",
	"secretAccessKey": "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",
	"region": "us-east-1"
});
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
var lastIndex = 0;

var app = express();

// app.use(express.static(__dirname + '/View'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dinosaur', function (req, res, next) {
	res.sendFile(path.join(app.get('views'),'dinosaur.html'));
});

var html = ''

app.use('/dashboard', function (req, res, next) {
	var scanParams = {
        TableName:  "feedback"
    };

    dynamodb.scan(scanParams, function(err, data) {
        if (err) {
            res.send('error');
        } else {
            // console += JSON.stringify(data) + '\n';
            let rating = 0;
            let ratings = {
            	'1': 0,
            	'2': 0,
            	'3': 0,
            	'4': 0,
            	'5': 0
            };
            let delivery = {
            	'Slow': 0,
            	'OK': 0,
            	'Fast': 0
            };
            let quality = {
            	'Bad': 0,
            	'Good': 0,
            	'Normal': 0
            };

            data.Items.forEach(function (e) {
            	ratings[e.RATING.S]++;
            	delivery[e.DELIVERY.S]++;
            	quality[e.QUALITY.S]++;
            });
            // res.send({
            // 	ratings: ratings,
            // 	delivery: delivery,
            // 	quality: quality
            // });
            res.sendFile(path.join(app.get('views'),'dashboard.html'));
        }
    });
});

app.use('/testdb', async function (req, res, next) {
	var console = '';
    
    ////////////////////////////////////////////////////
    console+= 'Current table VERYLONGTABLENAME value  \n';
    
    var scanParams = {
        TableName:  "VERYLONGTABLENAME"
    };
    
    await new Promise(function(done){
        dynamodb.scan(scanParams, function(err, data) {
            if (err) {
                console += "Error " + err +'\n';
            } else {
                console += JSON.stringify(data)+'\n';
                lastIndex = data.Count + 0 ;
            }
            done();
        });
    });
    
    ///////////////////////////////////////////////////
    console+= 'Try adding a record...  \n';
    
    var putParams = {
        TableName: 'VERYLONGTABLENAME',
        Item: {
        'CUSTOMER_ID' : {N: lastIndex + 1 + ''},
        'CUSTOMER_NAME' : {S: 'Richard Roe'},
        'abc': 1
      }
    };
    
    await new Promise(function(done){
        dynamodb.putItem(putParams, function(err, data) {
            if (err) {
                console += "Error " + err+'\n';
            } else {
                console += JSON.stringify(data)+'\n';
            }
            done();
        });
    });
    
    ///////////////////////////////////////////////////
    console+= 'Current table VERYLONGTABLENAME value  \n';
    
    await new Promise(function(done){
            dynamodb.scan(scanParams, function(err, data) {
                if (err) {
                    console += "Error " + err +'\n';
                } else {
                    console += JSON.stringify(data) + '\n';
                }
                done();
            });
        });

    var response = {
        "statusCode": 200,
        "headers": {
            "no": "need"
        },
        "body": console,
        "isBase64Encoded": false
    };
    
    return response;
});

app.use('/review', function (req, res, next) {
	res.sendFile(path.join(app.get('views'),'index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
