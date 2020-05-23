const express = require('express')
const fetch = require('node-fetch');
const session = require('express-session');
var knex = require('knex');
// var responseTime = require('response-time')
const KnexSessionStore = require("connect-session-knex")(session);
const bodyParser = require('body-parser'),
    path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const methodOverride = require('method-override')
const app = express()

//mysql://b4ab11989ab7cb:800704ea@us-cdbr-east-06.cleardb.net/heroku_cdd4f36eba0bfdd?reconnect=true
app.set('view engine', 'ejs')
// var app = new express()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(responseTime());


var sess;

const db = knex({
    client: 'mysql',
    connection: {
        host: 'us-cdbr-east-06.cleardb.net',
        user: 'b4ab11989ab7cb',
        password: '800704ea',
        database: 'heroku_cdd4f36eba0bfdd'
    },
    useNullAsDefault: true
});

const store = new KnexSessionStore({useNullAsDefault: true});
app.use(session({ 
    secret: 'ssshhhhh', 
    saveUninitialized: true, 
    resave: true,
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    },
    store: store
 }));

// app.use(methodOverride('_method'))

app.get('/', (req, res) => {
    res.redirect('/home')
})

app.get('/home', (req, res) => {
    res.render('index', {req : req})
})

app.post('/signin', (req, res) => {
    console.log(req.body);
    var { password, email } = req.body;
    sess = req.session;
    db.select('password', 'email').from('users')
        .where('email', '=', email)
        .then(user => {
            bcrypt.compare(password, user[0].password, function(err, result) {
                if (result) {
                    sess.email = email;
                    sess.save()
                    res.redirect('/home')
                } else {
                    res.json({ message: "username or email is incorrect" })
                }
            });
        }).catch(err => {
            res.json({ message: "username or email is incorrect" })
    })
});



app.post('/signup', (req, res) => {
    console.log(req.body);
    var { name, email, password } = req.body;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        db('users')
            .insert({
                email: email,
                name: name,
                password: hash
            }).then(()=>{
                res.redirect('/signin');
            }
        )
    });

});

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/signin', (req, res) => {
    res.render('signin')
})

// db.select('*').from('users').then(console.log);

app.listen(5000)