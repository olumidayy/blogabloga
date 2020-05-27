const express = require('express')
// const fetch = require('node-fetch');
const knex = require('knex');
const session = require('express-session');
const KnexSessionStore = require("connect-session-knex")(session);
const bodyParser = require('body-parser');
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


var split = (likes) => {
    return likes.split(',');
}

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
    store: store,
    useNullAsDefault: true
 }));

// app.use(methodOverride('_method'))

app.get('/', (req, res) => {
    res.redirect('/home')
})

app.get('/home', async (req, res) => {
    var posts;
    await db.select('*').from('posts').orderBy('id', 'desc').then(data =>
        posts = data
    );
    // console.log(posts)
    res.render('index', { req : req, posts : posts })
})

app.get('/dashboard', async (req, res) => {
    var posts;
    await db.select('*').from('posts').where('name', '=', req.session.user.name).orderBy('id', 'desc').then(data =>
        posts = data
    );
    // console.log(posts)
    res.render('index', { req : req, posts : posts })
})

app.post('/signin', (req, res) => {
    console.log(req.body);
    var { password, email } = req.body;
    sess = req.session;
    db('users')
        .where('email', '=', email)
        .then(user => {
            bcrypt.compare(password, user[0].password, function(err, result) {
                if (result) {
                    console.log(user)
                    sess.user = user[0];
                    sess.save()
                    res.redirect('/home')
                } else {
                    res.render('signin', {err:true})
                }
            });
        }).catch(err => {
            res.render('signin', {err:true})
    })
});



app.post('/signup', (req, res) => {
    var { name, email, password } = req.body;
    bcrypt.hash(password, saltRounds, function(err, hash) {
        db('users')
            .insert({
                email: email,
                name: name,
                password: hash
            }).then(()=>{
                res.redirect('/signin', {err:false});
            }
        )
    });

});

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/signin', (req, res) => {
    res.render('signin', {err:false})
})

app.get('/create', (req, res) => {
    res.render('create', {post : false})
})

app.post('/create', (req, res) => {
    sess = req.session.user;
    var { title, content} = req.body;
    db('posts')
            .insert({
                owner: sess.email,
                title: title,
                name: sess.name,
                content: content
            }).then(()=>{
                res.redirect('/home');
            }
        )
})

app.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    db('posts').where('id', '=', id).then(post => {
        res.render('create', {post : post[0]})
    })
})

app.post('/edit/:id', (req, res) => {
    let id = req.params.id;
    var {title, content} = req.body;
    db('posts').where({id : id}).update({
        title: title,
        content: content
    }).then(
        res.redirect('/')
    )
})

app.get('/delete/:id', (req, res) => {
    let id = req.params.id;
    db('posts').where('id', '=', id).del().then(
        res.redirect('/')
    )
})

app.get('/post/:id', (req, res) => {
    let id = req.params.id;
    db('posts').where('id', '=', id).then(post => {
        res.render('post', { post : post[0]})
    })
})

app.get('/like/:id', (req, res) => {
    if(req.session.user){
        let id = req.params.id;
        db('users').where('email', '=', req.session.user.email).then(user => {
            var likes = user[0].likes ? user[0].likes : '';
            if(likes.includes(id.toString())){
                res.redirect('back')
            } else {
                db('users').where('email', '=', req.session.user.email).update({
                    likes: user.likes ? user.likes + `${id.toString()},` : `${id.toString()},`,
                }).then(
                    db('posts').where({id : id}).then(post => {
                        db('posts').where({id : id}).update({
                            likes: post[0].likes ? post[0].likes + 1 : 1,
                        }).then(res.redirect('back'))
                    })
                )
            }
        })
    } else {
        res.redirect('/signin')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/home')
})

// db.select('*').from('users').then(console.log);

app.listen(process.env.PORT || 8080);