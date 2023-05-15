var logger;
require("./logger/logger.js").then(function (val) {
	logger = val;
	return val;
});

const express = require('express');
const session = require('express-session');
const app = express();
const login_router = require("./routes/login_router.js");
const inicial_router = require("./routes/inicial_router.js");

const port = 80;

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.get('/tela_inicial/*', (req, res, next) => {
	logger.error("Tentativa de login");
	console.log(`req.session:${JSON.stringify(req.session)}`);
	if (!req.session.loggedin) {
		console.log("não logado");
		res.redirect("/")
		return;
	} else {
		next()
	}
});

//Resposta basica
app.get('/alive', (req, res) => {
	res.send("alive");
	logger.info("INFO ALIVE");
	logger.error("ERROR ALIVE");
});

app.post('/alive', (req, res) => {
	res.send("alive");
});

app.post('/tela_inicial/*', (req, res, next) => {
	console.log(`req.session:${JSON.stringify(req.session)}`);
	if (!req.session.loggedin) {
		res.send({ "redirect": "/" });
		return;
	} else {
		next();
	}
});

app.use('/', login_router);
app.use('/tela_inicial', inicial_router);

app.listen(port);

console.log(`Running at port: ${port}`);